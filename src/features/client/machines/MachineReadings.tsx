import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Select, Modal, Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/ui';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { machinesApi, adminApi, ShiftTemplate } from '../../../shared/utils/api-service';
import { useAuth } from '../../../contexts/AuthContext';
import type { User } from '../../../shared/types';

interface MachineReadingData {
  machine_id: string;
  machine_number: number;
  machine_name: string;
  machine_type: string;
  total_in: string | null;
  total_out: string | null;
  previous_total_in: string;
  previous_total_out: string;
  today_in: string | null;
  today_out: string | null;
  has_reading: boolean;
}

interface ReadingsResponse {
  date: string;
  last_reading_datetime: string | null;
  machines: MachineReadingData[];
}

interface ValidationErrors {
  [machineId: string]: {
    total_in?: string;
    total_out?: string;
  };
}

export const MachineReadings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Get shop ID from URL params (admin) or sessionStorage (employee)
  const getEmployeeShopId = (): string => {
    const stored = sessionStorage.getItem('employee_selected_shop');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.id || '';
      } catch {
        return '';
      }
    }
    return '';
  };
  const selectedShopId = searchParams.get('shop_id') || getEmployeeShopId();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Error modal for validation errors on submit
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // Permission checks - CLIENT_ADMIN has full access, employees check permissions
  const isAdmin = user?.role === 'CLIENT_ADMIN';
  const permissions = user?.permissions as Record<string, boolean> | undefined;
  const canAddReadings = isAdmin || permissions?.can_add_machine_readings;

  // Field-level visibility permissions (admin sees everything, employees check permissions)
  const canViewTotalIn = isAdmin || permissions?.can_view_total_in !== false;
  const canViewTotalOut = isAdmin || permissions?.can_view_total_out !== false;
  const canViewTodayIn = isAdmin || permissions?.can_view_today_in !== false;
  const canViewTodayOut = isAdmin || permissions?.can_view_today_out !== false;

  // Date selection
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Shift templates
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');

  // Shift times
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');

  const [machineData, setMachineData] = useState<MachineReadingData[]>([]);
  const [lastReadingDateTime, setLastReadingDateTime] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employees, setEmployees] = useState<User[]>([]);

  // Track user inputs for each machine
  const [readings, setReadings] = useState<Record<string, { total_in: string; total_out: string }>>({});

  // Track validation errors for each machine
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Track overlap error
  const [, setOverlapError] = useState<string | null>(null);

  // Track if times are locked (when template is selected)
  const [, setTimesLocked] = useState(false);

  // Track checking overlap state
  const [, setCheckingOverlap] = useState(false);

  // Track 30-minute buffer warning
  const [, setBufferWarning] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load readings when date or shiftStart changes
  useEffect(() => {
    if (selectedDate && shiftStart) {
      loadReadings(shiftStart);
    } else if (selectedDate) {
      loadReadings();
      loadNextShiftTime();
    }
  }, [selectedDate, shiftStart]);

  // Check overlap when date, shiftStart, or shiftEnd changes
  useEffect(() => {
    if (selectedDate && shiftStart && shiftEnd) {
      checkOverlapForCurrentShift();
      check30MinuteBuffer();
    }
  }, [selectedDate, shiftStart, shiftEnd]);

  // Update shift times when template changes
  useEffect(() => {
    if (selectedTemplateId !== 'custom') {
      const template = shiftTemplates.find(t => t.id === selectedTemplateId);
      if (template) {
        setShiftStart(template.start_time);
        setShiftEnd(template.end_time);
        setTimesLocked(true);

        // Reload readings with new shift_start to get correct previous readings
        if (selectedDate) {
          loadReadings(template.start_time);
        }

        // Check overlap immediately when template is selected
        setTimeout(() => {
          checkOverlapForCurrentShift(template.start_time, template.end_time);
          check30MinuteBuffer(template.end_time);
        }, 100);
      }
    } else {
      setTimesLocked(false);
      setOverlapError(null);
      setBufferWarning(null);
    }
  }, [selectedTemplateId, shiftTemplates]);

  const loadInitialData = async () => {
    try {
      // For employees, auto-select themselves as the submitting employee
      if (!isAdmin && user) {
        setSelectedEmployeeId(user.id);
        // Create a minimal employee object for submission
        setEmployees([{
          id: user.id,
          full_name: user.full_name || `${user.name_first || ''} ${user.name_last || ''}`.trim() || user.email,
          access_code: user.access_code || '',
          name_first: user.name_first || '',
          name_last: user.name_last || '',
          status: 'ACTIVE',
        } as User]);
      }

      // Fetch shift templates
      const templatesData = await machinesApi.getShiftTemplates(true);
      const templates = Array.isArray(templatesData) ? templatesData : (templatesData?.results || []);
      setShiftTemplates(templates);

      // Only fetch employees for admins
      if (isAdmin) {
        const employeesData = await adminApi.getEmployees(selectedShopId || undefined);
        const employeesList = Array.isArray(employeesData) ? employeesData : ((employeesData as { results?: User[] })?.results || []);


        // Filter to show ACTIVE and INVITED employees (exclude DISABLED)
        const activeEmployees = employeesList.filter((emp: User) =>
          emp.status === 'ACTIVE' || emp.status === 'INVITED'
        );

        setEmployees(activeEmployees);

        // Set default selected employee if only one
        if (activeEmployees.length === 1) {
          setSelectedEmployeeId(activeEmployees[0].id);
        }

        // Show warning if no employees found
        if (activeEmployees.length === 0 && employeesList.length > 0) {
          setError('No active or invited employees found. Please activate employees in Employee Management.');
        } else if (activeEmployees.length === 0) {
          setError('No employees assigned to this shop. Please assign employees in Employee Management.');
        }
      }
    } catch (err: any) {

      setError(`Failed to load data: ${err.message || 'Please refresh the page.'}`);
      setEmployees([]);
    }
  };

  const loadNextShiftTime = async () => {
    try {
      const shiftTimeData = await machinesApi.getNextShiftTime(selectedDate);

      if (shiftTimeData.next_shift_start) {
        const nextStart = new Date(shiftTimeData.next_shift_start);
        const hours = String(nextStart.getHours()).padStart(2, '0');
        const minutes = String(nextStart.getMinutes()).padStart(2, '0');
        setShiftStart(`${hours}:${minutes}`);
      } else {
        setShiftStart('06:00');
      }

      // Set current time as default end time
      const now = new Date();
      setShiftEnd(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    } catch (err: any) {

      setShiftStart('06:00');
      const now = new Date();
      setShiftEnd(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }
  };

  // Helper function to build shift datetime strings
  const buildShiftDateTimeStrings = (date: string, startTime: string, endTime: string) => {
    const shiftStartDateTime = `${date}T${startTime}:00`;
    let endDate = date;
    if (endTime < startTime) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      endDate = nextDay.toISOString().split('T')[0];
    }
    const shiftEndDateTime = `${endDate}T${endTime}:00`;
    return { shiftStartDateTime, shiftEndDateTime };
  };

  // Check 30-minute buffer before shift end time
  const check30MinuteBuffer = (endTime?: string) => {
    const checkEndTime = endTime || shiftEnd;
    if (!checkEndTime || !selectedDate) {
      setBufferWarning(null);
      return;
    }

    try {
      const now = new Date();

      // Calculate shift end datetime
      let endDate = selectedDate;
      const [endHours, endMinutes] = checkEndTime.split(':').map(Number);
      if (checkEndTime < shiftStart) {
        // Overnight shift - end date is next day
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        endDate = nextDay.toISOString().split('T')[0];
      }

      const [year, month, day] = endDate.split('-').map(Number);
      const shiftEndDateTime = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);

      // Calculate 30 minutes before shift end
      const thirtyMinutesBeforeEnd = new Date(shiftEndDateTime.getTime() - (30 * 60 * 1000));

      // Check if current time is at least 30 minutes before shift end
      if (now < thirtyMinutesBeforeEnd) {
        const allowedTimeStr = thirtyMinutesBeforeEnd.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        setBufferWarning(`You are supposed to take readings after ${allowedTimeStr} (30 minutes before shift end time).`);
      } else {
        setBufferWarning(null);
      }
    } catch (err) {

      setBufferWarning(null);
    }
  };

  // Check overlap for current shift configuration
  const checkOverlapForCurrentShift = async (startTime?: string, endTime?: string) => {
    const checkStartTime = startTime || shiftStart;
    const checkEndTime = endTime || shiftEnd;

    if (!checkStartTime || !checkEndTime || !selectedDate) {
      setOverlapError(null);
      return;
    }

    try {
      setCheckingOverlap(true);
      const { shiftStartDateTime, shiftEndDateTime } = buildShiftDateTimeStrings(
        selectedDate,
        checkStartTime,
        checkEndTime
      );

      // Pass selectedShopId to check overlap only for this shop
      const overlapCheck = await machinesApi.checkOverlap(shiftStartDateTime, shiftEndDateTime, selectedShopId || undefined);

      if (overlapCheck.has_overlap) {
        setOverlapError(overlapCheck.message);
      } else {
        setOverlapError(null);
      }
    } catch (err: any) {

      setOverlapError(null);
    } finally {
      setCheckingOverlap(false);
    }
  };


  const loadReadings = async (shiftStartParam?: string) => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      // Build shift_start datetime if provided
      let shiftStartDatetime: string | undefined;
      if (shiftStartParam && selectedDate) {
        shiftStartDatetime = `${selectedDate}T${shiftStartParam}:00`;
      }

      const data: ReadingsResponse = await machinesApi.getReadingsByDate(
        selectedDate,
        shiftStartDatetime,
        selectedShopId || undefined
      );
      setMachineData(data.machines || []);
      const lastReading = data.last_reading_datetime || null;
      setLastReadingDateTime(lastReading);

      // Validate date/time against last reading after loading
      // Only show error if selected shift start is BEFORE last reading end
      // Allow starting at or after the last reading end time
      if (lastReading && selectedDate && shiftStart) {
        const lastReadingEnd = new Date(lastReading); // This is the shift_end of last reading

        // Parse shift start time components
        const [hours, minutes] = shiftStart.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          // Invalid time format, skip validation
          return;
        }

        // Create date for selected shift start - use same date parsing approach
        // Parse the date string to get year, month, day
        const [year, month, day] = selectedDate.split('-').map(Number);
        const selectedShiftStart = new Date(year, month - 1, day, hours, minutes, 0, 0);

        // Compare timestamps - only error if new shift starts BEFORE last reading ends
        // Allow if new shift starts at or after last reading ends (even by 1 second)
        const lastReadingTime = lastReadingEnd.getTime();
        const selectedTime = selectedShiftStart.getTime();

        // Only show error if selected time is significantly before last reading (more than 1 minute)
        // This accounts for any timezone or precision differences
        const oneMinuteMs = 60 * 1000;
        if (selectedTime < (lastReadingTime - oneMinuteMs)) {
          const lastReadingStr = lastReadingEnd.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          setError(`Past readings are not allowed. You need to enter readings after the latest reading date and time (${lastReadingStr}). Please select a date/time after this.`);
        } else {
          // Clear error if validation passes
          setError((prev) => {
            if (prev?.includes('Past readings are not allowed') || prev?.includes('Cannot enter readings before the last reading')) {
              return null;
            }
            return prev;
          });
        }
      }

      // Initialize readings state with empty values (for new readings)
      const initialReadings: Record<string, { total_in: string; total_out: string }> = {};
      for (const machine of data.machines) {
        initialReadings[machine.machine_id] = {
          total_in: '',
          total_out: '',
        };
      }
      setReadings(initialReadings);
    } catch (err: any) {
      setError(err.message || 'Failed to load readings');
      setMachineData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayValue = (currentValue: string, previousValue: string): string => {
    const current = parseFloat(currentValue);
    const previous = parseFloat(previousValue) || 0;
    if (isNaN(current)) return '-';
    const diff = current - previous;
    return diff.toFixed(2);
  };

  const validateReading = (
    _machineId: string,
    _field: 'total_in' | 'total_out',
    value: string,
    previousValue: string
  ): string | undefined => {
    const current = parseFloat(value);
    const previous = parseFloat(previousValue);

    if (isNaN(current)) return undefined;
    if (isNaN(previous)) return undefined;

    if (current < previous) {
      return `Must be ≥ ${previous.toFixed(2)}`;
    }
    return undefined;
  };

  const summary = useMemo(() => {
    let totalTodayIn = 0;
    let totalTodayOut = 0;

    for (const machine of machineData) {
      const reading = readings[machine.machine_id];
      if (reading?.total_in && reading?.total_out) {
        const todayIn = parseFloat(reading.total_in) - parseFloat(machine.previous_total_in || '0');
        const todayOut = parseFloat(reading.total_out) - parseFloat(machine.previous_total_out || '0');
        if (!isNaN(todayIn)) totalTodayIn += todayIn;
        if (!isNaN(todayOut)) totalTodayOut += todayOut;
      }
    }

    const balance = totalTodayIn - totalTodayOut;

    return {
      totalTodayIn: totalTodayIn.toFixed(2),
      totalTodayOut: totalTodayOut.toFixed(2),
      balance: balance.toFixed(2),
      isNegative: balance < 0,
    };
  }, [machineData, readings]);

  const handleReadingChange = (machineId: string, field: 'total_in' | 'total_out', value: string) => {
    setReadings((prev) => ({
      ...prev,
      [machineId]: {
        ...prev[machineId],
        [field]: value,
      },
    }));

    const machine = machineData.find(m => m.machine_id === machineId);
    if (machine) {
      const previousValue = field === 'total_in' ? machine.previous_total_in : machine.previous_total_out;
      const errorMsg = validateReading(machineId, field, value, previousValue);

      setValidationErrors((prev) => {
        const machineErrors = { ...prev[machineId] };
        if (errorMsg) {
          machineErrors[field] = errorMsg;
        } else {
          delete machineErrors[field];
        }

        if (Object.keys(machineErrors).length === 0) {
          const { [machineId]: _, ...rest } = prev;
          return rest;
        }

        return {
          ...prev,
          [machineId]: machineErrors,
        };
      });
    }
  };

  const hasValidationErrors = useMemo(() => {
    return Object.keys(validationErrors).length > 0;
  }, [validationErrors]);


  // Format time for display (12-hour format)
  const formatTime = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Helper to show validation error modal
  const showValidationError = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setShowErrorModal(true);
  };

  // Format last reading datetime for display (kept for future use)
  // Note: This function is intentionally unused but provides utility for UI display
  const formatLastReadingDate = () => {
    if (!lastReadingDateTime) return 'No previous readings';
    const date = new Date(lastReadingDateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  void formatLastReadingDate; // Suppress unused warning

  const handleSubmit = async () => {
    // Clear any previous errors
    setError(null);

    if (!selectedEmployeeId) {
      showValidationError('Employee Required', 'Please select an employee to submit readings.');
      return;
    }

    // Get the selected employee and their access_code
    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
    if (!selectedEmployee || !selectedEmployee.access_code) {
      showValidationError(
        'Access Code Missing',
        'The selected employee does not have an access code configured. Please contact your administrator to set up an access code for this employee.'
      );
      return;
    }

    if (hasValidationErrors) {
      showValidationError(
        'Invalid Readings',
        'Some readings have validation errors. All Total IN and Total OUT values must be greater than or equal to their previous values. Please review and correct the highlighted fields.'
      );
      return;
    }

    // Validate shift times
    if (!shiftStart || !shiftEnd) {
      showValidationError('Shift Times Required', 'Please set both shift start and end times before submitting.');
      return;
    }

    const { shiftStartDateTime, shiftEndDateTime } = buildShiftDateTimeStrings(
      selectedDate,
      shiftStart,
      shiftEnd
    );

    // Get current time once for all validations
    const now = new Date();

    // Check 30-minute buffer before allowing submission
    const shiftEndDT = new Date(shiftEndDateTime);
    const thirtyMinutesBeforeEnd = new Date(shiftEndDT.getTime() - (30 * 60 * 1000));

    if (now < thirtyMinutesBeforeEnd) {
      const allowedTimeStr = thirtyMinutesBeforeEnd.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      showValidationError(
        'Too Early to Submit',
        `You can only submit readings starting 30 minutes before the shift ends. Earliest allowed time: ${allowedTimeStr}. Please wait or adjust your shift end time.`
      );
      return;
    }

    // Validate not future date/time
    const shiftEndDate = new Date(shiftEndDateTime);
    if (shiftEndDate > now) {
      showValidationError(
        'Future Date/Time Not Allowed',
        'Cannot enter readings for a shift ending in the future. Please adjust the date and/or shift end time to the current time or earlier.'
      );
      return;
    }

    if (lastReadingDateTime) {
      const lastReadingEnd = new Date(lastReadingDateTime);
      const selectedShiftStart = new Date(shiftStartDateTime);
      const oneMinuteMs = 60 * 1000;

      if (selectedShiftStart.getTime() < (lastReadingEnd.getTime() - oneMinuteMs)) {
        const lastReadingStr = lastReadingEnd.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        showValidationError(
          'Cannot Submit Past Readings',
          `The last recorded reading was on ${lastReadingStr}. Your new shift must start after this time. Please select a date/time after the last recorded reading.`
        );
        return;
      }
    }

    // Final overlap check before submitting (in case something changed)
    try {
      const overlapCheck = await machinesApi.checkOverlap(shiftStartDateTime, shiftEndDateTime, selectedShopId || undefined);
      if (overlapCheck.has_overlap) {
        const overlapMessage = overlapCheck.message || 'Readings already exist for this time slot.';
        showValidationError(
          'Shift Time Overlap',
          `${overlapMessage} Please select a different date/time or edit the existing readings.`
        );
        return;
      }
    } catch (err: any) {

      // Continue anyway if check fails
    }

    // Validate all machines have readings
    const readingsData = [];
    const newValidationErrors: ValidationErrors = {};

    for (const machine of machineData) {
      const reading = readings[machine.machine_id];
      if (!reading?.total_in || !reading?.total_out) {
        setError(`Please enter readings for ${machine.machine_name}`);
        return;
      }

      const totalInError = validateReading(
        machine.machine_id,
        'total_in',
        reading.total_in,
        machine.previous_total_in
      );
      const totalOutError = validateReading(
        machine.machine_id,
        'total_out',
        reading.total_out,
        machine.previous_total_out
      );

      if (totalInError || totalOutError) {
        newValidationErrors[machine.machine_id] = {};
        if (totalInError) newValidationErrors[machine.machine_id].total_in = totalInError;
        if (totalOutError) newValidationErrors[machine.machine_id].total_out = totalOutError;
      }

      readingsData.push({
        machine_id: machine.machine_id,
        total_in: reading.total_in,
        total_out: reading.total_out,
      });
    }

    if (Object.keys(newValidationErrors).length > 0) {
      setValidationErrors(newValidationErrors);
      setError('Readings must be greater than or equal to previous values');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await machinesApi.submitBulkReadings({
        date: selectedDate,
        shift_start: shiftStartDateTime,
        shift_end: shiftEndDateTime,
        employee_access_code: selectedEmployee.access_code.toUpperCase(),
        readings: readingsData,
      });

      // Show success modal
      // Parse date as local date by splitting the string (avoids UTC timezone shift)
      const [year, month, day] = selectedDate.split('-').map(Number);
      const localDate = new Date(year, month - 1, day); // month is 0-indexed
      const formattedDate = localDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      setSuccessMessage(
        `Reading noted for ${formattedDate} from ${formatTime(shiftStart)} to ${formatTime(shiftEnd)}.\n\nToday IN: $${result.total_today_in}\nToday OUT: $${result.total_today_out}\nBalance: $${result.balance}`
      );
      setShowSuccessModal(true);

      // Store shift details for navigation to shift reports
      sessionStorage.setItem('shiftReportParams', JSON.stringify({
        date: selectedDate,
        shopId: selectedShopId,
        fromTime: shiftStart,
        toTime: shiftEnd,
      }));

      // Clear form
      setSelectedEmployeeId('');
      const clearedReadings: Record<string, { total_in: string; total_out: string }> = {};
      for (const machine of machineData) {
        clearedReadings[machine.machine_id] = { total_in: '', total_out: '' };
      }
      setReadings(clearedReadings);
      setValidationErrors({});

    } catch (err: any) {
      let errorMessage = 'Failed to submit readings';
      if (err.employee_access_code) {
        errorMessage = Array.isArray(err.employee_access_code)
          ? err.employee_access_code[0]
          : err.employee_access_code;
        // Update error message for employee selection context
        if (errorMessage.includes('Invalid employee access code')) {
          errorMessage = 'Invalid employee selected. Please select a valid employee.';
        }
      } else if (err.readings) {
        errorMessage = Array.isArray(err.readings)
          ? err.readings.join(', ')
          : err.readings;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.detail) {
        errorMessage = err.detail;
      }
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Reload readings for the new shift
    loadReadings();
    loadNextShiftTime();
  };

  if (loading) {
    return (
      <PageContainer>
        <Loading message="Loading readings..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Machine Readings"
        subtitle="Enter shift readings for all machines"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/client/machines')}
            className="text-xs min-[350px]:text-sm whitespace-nowrap"
          >
            Back
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Date and Shift Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Machine Reading Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Row 1: Date and Shift Template */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              type="date"
              label="Reading Date"
              value={selectedDate}
              onChange={async (e) => {
                const selected = new Date(e.target.value);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                if (selected > today) {
                  setError('Cannot enter readings for future dates. Please select today or a past date.');
                  return;
                }
                setError(null);
                setOverlapError(null);
                const newDate = e.target.value;
                setSelectedDate(newDate);

                // Check overlap immediately after date changes
                if (shiftStart && shiftEnd) {
                  setTimeout(() => {
                    checkOverlapForCurrentShift();
                  }, 100);
                }
              }}
              max={new Date().toISOString().split('T')[0]}
              fullWidth
              className="dark:[&::-webkit-calendar-picker-indicator]:invert"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  const newTemplateId = e.target.value;
                  setSelectedTemplateId(newTemplateId);
                  if (newTemplateId === 'custom') {
                    setTimesLocked(false);
                    setOverlapError(null);
                    // Load next shift time for custom
                    loadNextShiftTime();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="custom">Custom Time</option>
                {shiftTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.display_time})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Time selectors (only editable for custom) */}
          {selectedTemplateId === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 dark:bg-slate-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Start</label>
                <input
                  type="time"
                  value={shiftStart}
                  onChange={async (e) => {
                    const newTime = e.target.value;
                    const now = new Date();
                    const shiftDateTime = new Date(`${selectedDate}T${newTime}:00`);
                    if (shiftDateTime > now) {
                      setError('Cannot select future time. Please select current or past time.');
                      return;
                    }

                    // Check if before last reading end time
                    if (lastReadingDateTime) {
                      const lastReadingEnd = new Date(lastReadingDateTime);
                      const oneMinuteMs = 60 * 1000;
                      if (shiftDateTime.getTime() < (lastReadingEnd.getTime() - oneMinuteMs)) {
                        const lastReadingStr = lastReadingEnd.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });
                        setError(`Past readings are not allowed. You need to enter readings after the latest reading date and time (${lastReadingStr}). Please select a time after this.`);
                        return;
                      } else {
                        setError((prev) => {
                          if (prev?.includes('Past readings are not allowed') || prev?.includes('Cannot enter readings before the last reading')) {
                            return null;
                          }
                          return prev;
                        });
                      }
                    }

                    setOverlapError(null);
                    setShiftStart(newTime);

                    // Check overlap and buffer immediately
                    if (newTime && shiftEnd && selectedDate) {
                      setTimeout(() => {
                        checkOverlapForCurrentShift(newTime, shiftEnd);
                        check30MinuteBuffer(shiftEnd);
                      }, 100);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:[&::-webkit-calendar-picker-indicator]:invert"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTime(shiftStart)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift End</label>
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={async (e) => {
                    const newTime = e.target.value;
                    const now = new Date();
                    let endDate = selectedDate;
                    if (newTime < shiftStart) {
                      const nextDay = new Date(selectedDate);
                      nextDay.setDate(nextDay.getDate() + 1);
                      endDate = nextDay.toISOString().split('T')[0];
                    }
                    const shiftDateTime = new Date(`${endDate}T${newTime}:00`);
                    if (shiftDateTime > now) {
                      setError('Cannot select future time. Please select current or past time.');
                      return;
                    }

                    setError(null);
                    setOverlapError(null);
                    setShiftEnd(newTime);

                    // Check overlap and buffer immediately
                    if (shiftStart && newTime && selectedDate) {
                      setTimeout(() => {
                        checkOverlapForCurrentShift(shiftStart, newTime);
                        check30MinuteBuffer(newTime);
                      }, 100);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:[&::-webkit-calendar-picker-indicator]:invert"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTime(shiftEnd)}</div>
              </div>
            </div>
          )}

          {/* Display selected shift time if using template */}
          {selectedTemplateId !== 'custom' && (() => {
            const template = shiftTemplates.find(t => t.id === selectedTemplateId);
            return template && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-400">
                  <strong>{template.name}:</strong> {formatTime(template.start_time)} - {formatTime(template.end_time)}
                  {template.is_overnight && <span className="ml-2 text-purple-600">(Overnight)</span>}
                </p>
              </div>
            );
          })()}

          {/* Last reading info */}
          {lastReadingDateTime && (
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <span className="font-medium">Last readings recorded:</span>{' '}
              {new Date(lastReadingDateTime).toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {machineData.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          {isAdmin ? (
            <>
              <p className="text-gray-500 dark:text-gray-400">No machines found. Please add machines first.</p>
              <Button onClick={() => navigate('/client/machines')} className="mt-4">
                Go to Machines
              </Button>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No machines alloted for this Shop. Check with Owner of the Shop..</p>
          )}
        </div>
      ) : (
        <>
          {/* Readings Table */}
          {/* Desktop Table - hidden on mobile */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Machine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  {canViewTotalIn && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total IN</th>}
                  {canViewTotalOut && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total OUT</th>}
                  {canViewTodayIn && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today IN</th>}
                  {canViewTodayOut && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today OUT</th>}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {machineData.map((machine) => {
                  const reading = readings[machine.machine_id] || { total_in: '', total_out: '' };
                  const todayIn = calculateTodayValue(reading.total_in, machine.previous_total_in);
                  const todayOut = calculateTodayValue(reading.total_out, machine.previous_total_out);
                  const machineErrors = validationErrors[machine.machine_id] || {};

                  return (
                    <tr key={machine.machine_id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 dark:text-white">{machine.machine_name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{machine.machine_type}</span>
                      </td>
                      {canViewTotalIn && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={reading.total_in}
                            onChange={(e) => handleReadingChange(machine.machine_id, 'total_in', e.target.value)}
                            className={`w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${machineErrors.total_in
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 dark:border-slate-600 focus:ring-slate-500'
                              }`}
                            placeholder={machine.previous_total_in}
                          />
                          <div className="text-xs text-gray-400 mt-1">Prev: {machine.previous_total_in}</div>
                          {machineErrors.total_in && (
                            <div className="text-xs text-red-600 mt-1">{machineErrors.total_in}</div>
                          )}
                        </td>
                      )}
                      {canViewTotalOut && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={reading.total_out}
                            onChange={(e) => handleReadingChange(machine.machine_id, 'total_out', e.target.value)}
                            className={`w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${machineErrors.total_out
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 dark:border-slate-600 focus:ring-slate-500'
                              }`}
                            placeholder={machine.previous_total_out}
                          />
                          <div className="text-xs text-gray-400 mt-1">Prev: {machine.previous_total_out}</div>
                          {machineErrors.total_out && (
                            <div className="text-xs text-red-600 mt-1">{machineErrors.total_out}</div>
                          )}
                        </td>
                      )}
                      {canViewTodayIn && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-semibold ${todayIn !== '-' && parseFloat(todayIn) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {todayIn !== '-' ? `$${todayIn}` : '-'}
                          </span>
                        </td>
                      )}
                      {canViewTodayOut && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-semibold ${todayOut !== '-' && parseFloat(todayOut) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {todayOut !== '-' ? `$${todayOut}` : '-'}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards - hidden on desktop */}
          <div className="md:hidden space-y-4 mb-6">
            {machineData.map((machine) => {
              const reading = readings[machine.machine_id] || { total_in: '', total_out: '' };
              const todayIn = calculateTodayValue(reading.total_in, machine.previous_total_in);
              const todayOut = calculateTodayValue(reading.total_out, machine.previous_total_out);
              const machineErrors = validationErrors[machine.machine_id] || {};

              return (
                <div key={machine.machine_id} className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-hidden">
                  {/* Machine Header - Slate background to match Table cards */}
                  <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-4 py-3 flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white text-base">{machine.machine_name}</h3>
                      <span className="text-xs text-slate-300">{machine.machine_type}</span>
                    </div>
                    {/* Today Summary on right */}
                    <div className="text-right">
                      {canViewTodayIn && todayIn !== '-' && (
                        <div className="text-sm">
                          <span className="text-slate-300">IN: </span>
                          <span className="font-bold text-green-400">${todayIn}</span>
                        </div>
                      )}
                      {canViewTodayOut && todayOut !== '-' && (
                        <div className="text-sm">
                          <span className="text-slate-300">OUT: </span>
                          <span className="font-bold text-red-400">${todayOut}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input Fields - stacked */}
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-800">
                    {canViewTotalIn && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Total IN <span className="text-gray-400">(Prev: {machine.previous_total_in})</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={reading.total_in}
                          onChange={(e) => handleReadingChange(machine.machine_id, 'total_in', e.target.value)}
                          className={`w-full px-3 py-3 text-base border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${machineErrors.total_in
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-slate-600 focus:ring-slate-500'
                            }`}
                          placeholder={machine.previous_total_in}
                        />
                        {machineErrors.total_in && (
                          <div className="text-xs text-red-600 mt-1">{machineErrors.total_in}</div>
                        )}
                      </div>
                    )}
                    {canViewTotalOut && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Total OUT <span className="text-gray-400">(Prev: {machine.previous_total_out})</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={reading.total_out}
                          onChange={(e) => handleReadingChange(machine.machine_id, 'total_out', e.target.value)}
                          className={`w-full px-3 py-3 text-base border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${machineErrors.total_out
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-slate-600 focus:ring-slate-500'
                            }`}
                          placeholder={machine.previous_total_out}
                        />
                        {machineErrors.total_out && (
                          <div className="text-xs text-red-600 mt-1">{machineErrors.total_out}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Section */}
          {(canViewTodayIn || canViewTodayOut) && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shift Summary</h3>
              <div className="flex flex-wrap gap-6">
                {canViewTodayIn && (
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg flex-1 min-w-[200px]">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Today IN</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">${summary.totalTodayIn}</p>
                  </div>
                )}
                {canViewTodayOut && (
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg flex-1 min-w-[200px]">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Today OUT</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">${summary.totalTodayOut}</p>
                  </div>
                )}
                {canViewTodayIn && canViewTodayOut && (
                  <div className={`text-center p-4 rounded-lg flex-1 min-w-[200px] ${summary.isNegative ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance (IN - OUT)</p>
                    <p className={`text-2xl font-bold ${summary.isNegative ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {summary.isNegative ? '-' : ''}${Math.abs(parseFloat(summary.balance)).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 min-[400px]:p-6">
            <h3 className="text-base min-[400px]:text-lg font-semibold text-gray-900 dark:text-white mb-4">Submit Readings</h3>
            <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-end gap-3 min-[500px]:gap-4">
              <div className="w-full min-[500px]:flex-1 min-[500px]:max-w-xs">
                {!isAdmin ? (
                  // For employees, show their name as a label (auto-selected)
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Submitting as:</p>
                    <p className="text-base font-medium text-blue-800 dark:text-blue-400">
                      {user?.full_name || `${user?.name_first || ''} ${user?.name_last || ''}`.trim() || user?.email}
                    </p>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium mb-1">No employees available</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500">
                      Please create employees in Employee Management first.
                    </p>
                  </div>
                ) : (
                  <Select
                    label="Employee"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    options={[
                      { value: '', label: 'Select an employee...' },
                      ...employees.map(emp => ({
                        value: emp.id,
                        label: emp.full_name || `${emp.name_first} ${emp.name_last}`
                      }))
                    ]}
                    fullWidth
                  />
                )}
              </div>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                size="lg"
                disabled={hasValidationErrors || !selectedEmployeeId || !canAddReadings}
                className="w-full min-[500px]:w-auto whitespace-nowrap"
              >
                Submit Readings
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {isAdmin ? 'Select the employee who is submitting these readings.' : 'You are submitting readings as yourself.'}
            </p>
            {hasValidationErrors && (
              <p className="text-xs text-red-600 mt-2">
                Please fix the validation errors above. All readings must be greater than or equal to previous values.
              </p>
            )}
          </div>
        </>
      )}

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Readings Saved Successfully"
        footer={
          <div className="flex justify-between w-full">
            <Button variant="secondary" onClick={() => navigate('/client/reports?tab=shift')}>
              View Shift Reports
            </Button>
            <Button onClick={handleSuccessClose}>
              Enter New Shift
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <svg className="h-8 w-8 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{successMessage}</p>
        </div>
      </Modal>

      {/* Error Validation Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorModalTitle}
        footer={
          <Button onClick={() => setShowErrorModal(false)}>
            Close
          </Button>
        }
      >
        <div className="py-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg className="h-8 w-8 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-center">{errorModalMessage}</p>
          {lastReadingDateTime && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Last recorded reading:</strong><br />
                {new Date(lastReadingDateTime).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </PageContainer>
  );
};
