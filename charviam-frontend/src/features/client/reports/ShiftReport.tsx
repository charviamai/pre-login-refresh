import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Select } from '../../../shared/components/ui';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Loading } from '../../../shared/components/Loading';
import { machinesApi, adminApi, ShiftTemplate } from '../../../shared/utils/api-service';
import { useAuth } from '../../../contexts/AuthContext';

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

interface Employee {
  id: string;
  name_first: string;
  name_last: string;
  email?: string;
  full_name?: string;
}

interface Shop {
  id: string;
  name: string;
}

export const ShiftReport: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    shop_id?: string;
    from_time?: string;
    to_time?: string;
  }>({});

  // Shift templates
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');

  // Custom shifts (shifts without templates)
  const [customShifts, setCustomShifts] = useState<Array<{
    shift_start: string;
    shift_end: string;
    start_time: string;
    end_time: string;
    employee_name: string | null;
  }>>([]);

  // Date and Time fields
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [fromTime, setFromTime] = useState('06:00');
  const [toTime, setToTime] = useState('');
  const [lastReadingDateTime, setLastReadingDateTime] = useState<string | null>(null);

  const [machineData, setMachineData] = useState<MachineReadingData[]>([]);
  const [inventoryAmount, setInventoryAmount] = useState<string>('0');

  // Auto-fetched amounts
  const [totalSpinMatchAmount, setTotalSpinMatchAmount] = useState<number>(0);

  // Employee selection
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  // Employee name from readings
  const [employeeNameFromReading, setEmployeeNameFromReading] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Check for pre-populated params from Machine Readings (via sessionStorage)
  useEffect(() => {
    const storedParams = sessionStorage.getItem('shiftReportParams');
    if (storedParams) {
      try {
        const params = JSON.parse(storedParams);
        if (params.date) setSelectedDate(params.date);
        if (params.shopId) setSelectedShopId(params.shopId);
        if (params.fromTime) setFromTime(params.fromTime);
        if (params.toTime) setToTime(params.toTime);
        // Set to custom template since we have custom times
        setSelectedTemplateId('custom');
        // Clear the params after reading
        sessionStorage.removeItem('shiftReportParams');
      } catch (e) {
        // Invalid JSON in storage - clear it
        console.log('Could not parse shift report params:', e);
        sessionStorage.removeItem('shiftReportParams');
      }
    }
  }, []);

  // Update times when shift template changes
  useEffect(() => {
    if (selectedTemplateId !== 'custom' && !selectedTemplateId.startsWith('custom_shift_')) {
      const template = shiftTemplates.find(t => t.id === selectedTemplateId);
      if (template) {
        setFromTime(template.start_time);
        setToTime(template.end_time);
        // Clear employee name from reading when switching templates
        setEmployeeNameFromReading(null);
      }
    } else if (selectedTemplateId.startsWith('custom_shift_')) {
      // Handle custom shift selection
      const customShift = customShifts.find(cs => `custom_shift_${cs.shift_start}` === selectedTemplateId);
      if (customShift) {
        setFromTime(customShift.start_time);
        setToTime(customShift.end_time);
        if (customShift.employee_name) {
          setEmployeeNameFromReading(customShift.employee_name);
          const employee = employees.find(emp =>
            (emp.full_name || `${emp.name_first} ${emp.name_last}`) === customShift.employee_name
          );
          if (employee) {
            setSelectedEmployeeId(employee.id);
          }
        }
      }
    }
  }, [selectedTemplateId, shiftTemplates, customShifts, employees]);

  // Reset report when filters change
  useEffect(() => {
    setReportGenerated(false);
    setMachineData([]);
    setTotalSpinMatchAmount(0);
  }, [selectedDate, fromTime, toTime, selectedShopId]);

  // Load custom shifts when date or shop changes
  useEffect(() => {
    if (selectedDate && selectedShopId) {
      loadCustomShifts();
    } else {
      setCustomShifts([]);
    }
  }, [selectedDate, selectedShopId]);

  const loadCustomShifts = async () => {
    if (!selectedDate || !selectedShopId) return;

    try {
      const customShiftsData = await machinesApi.getCustomShifts(selectedDate, selectedShopId);
      setCustomShifts(customShiftsData.custom_shifts || []);
    } catch (err: any) {

      setCustomShifts([]);
    }
  };

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      const isEmployee = user?.role === 'EMPLOYEE';

      if (isEmployee) {
        // Employee: skip getShops(), use assigned_shops from user context
        const templatesData = await machinesApi.getShiftTemplates(true);
        const templatesList = Array.isArray(templatesData) ? templatesData : ((templatesData as any)?.results || []);
        setShiftTemplates(templatesList);

        // Get selected shop from sessionStorage (set during login shop selection)
        const storedShop = sessionStorage.getItem('employee_selected_shop');
        if (storedShop) {
          const selectedShop = JSON.parse(storedShop);
          const employeeShops: Shop[] = [{
            id: selectedShop.id,
            name: selectedShop.name,
          }];
          setShops(employeeShops);
          // Auto-select the employee's shop
          setSelectedShopId(selectedShop.id);
        }

        // Set employee list with just the current user for employee view
        if (user) {
          setEmployees([{
            id: user.id,
            name_first: user.name_first || '',
            name_last: user.name_last || '',
            email: user.email,
            full_name: user.full_name,
          }]);
        }
      } else {
        // Admin: load employees, shops, and shift templates
        const [employeesData, shopsData, templatesData] = await Promise.all([
          adminApi.getEmployees(),
          adminApi.getShops(),
          machinesApi.getShiftTemplates(true)
        ]);
        const employeesList = Array.isArray(employeesData) ? employeesData : ((employeesData as any)?.results || []);
        const shopsList = Array.isArray(shopsData) ? shopsData : ((shopsData as any)?.results || []);
        const templatesList = Array.isArray(templatesData) ? templatesData : ((templatesData as any)?.results || []);

        setEmployees(employeesList);
        setShops(shopsList);
        setShiftTemplates(templatesList);

        // Auto-select first shop if only one
        if (shopsList.length === 1) {
          setSelectedShopId(shopsList[0].id);
        }
      }

      // Set default end time to current time
      const now = new Date();
      setToTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    } catch (err: any) {
      console.error('Failed to load initial shift report data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleGetReport = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Field-level validation
    const errors: typeof fieldErrors = {};
    if (!selectedShopId) errors.shop_id = 'Required';
    if (!fromTime) errors.from_time = 'Required';
    if (!toTime) errors.to_time = 'Required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build shift_start datetime for filtering readings
      const shiftStartDatetime = `${selectedDate}T${fromTime}:00`;

      // Calculate end date for overnight shifts
      let endDate = selectedDate;
      if (toTime < fromTime) {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        endDate = nextDay.toISOString().split('T')[0];
      }

      // Load machine readings and kiosk plays in parallel
      const [readingsData, playsData, _shiftTimeData] = await Promise.all([
        machinesApi.getReadingsByDate(selectedDate, shiftStartDatetime, selectedShopId),
        adminApi.getPlaysReport({
          date_from: selectedDate,
          date_to: endDate,
          time_from: fromTime,
          time_to: toTime,
          shop_id: selectedShopId,
          play_type: 'BOTH',
        }),
        machinesApi.getNextShiftTime(selectedDate),
      ]);

      // Set machine data
      setMachineData(readingsData.machines || []);
      setLastReadingDateTime(readingsData.last_reading_datetime || null);

      // Auto-populate employee name if available (always update if data is available)
      if (readingsData.employee_name) {
        setEmployeeNameFromReading(readingsData.employee_name);
        const employee = employees.find(emp =>
          (emp.full_name || `${emp.name_first} ${emp.name_last}`) === readingsData.employee_name
        );
        if (employee) {
          setSelectedEmployeeId(employee.id);
        }
      } else {
        setEmployeeNameFromReading(null);
      }

      // Set spin/match amount from plays report
      const spinMatchTotal = playsData?.summary?.total_amount || 0;
      setTotalSpinMatchAmount(spinMatchTotal);

      setReportGenerated(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
      setMachineData([]);
      setTotalSpinMatchAmount(0);
    } finally {
      setLoading(false);
    }
  };

  // Calculate machine reading totals
  const machineReadingsSummary = useMemo(() => {
    let totalTodayIn = 0;
    let totalTodayOut = 0;

    for (const machine of machineData) {
      if (machine.total_in && machine.total_out) {
        const prevIn = parseFloat(machine.previous_total_in || '0');
        const prevOut = parseFloat(machine.previous_total_out || '0');
        const currIn = parseFloat(machine.total_in);
        const currOut = parseFloat(machine.total_out);

        totalTodayIn += currIn - prevIn;
        totalTodayOut += currOut - prevOut;
      }
    }

    return {
      totalTodayIn: totalTodayIn.toFixed(2),
      totalTodayOut: totalTodayOut.toFixed(2),
    };
  }, [machineData]);

  // Total Payout = Total Today OUT from machine readings
  const totalPayoutAmount = useMemo(() => {
    return parseFloat(machineReadingsSummary.totalTodayOut) || 0;
  }, [machineReadingsSummary.totalTodayOut]);

  // Calculate Total Amount in Register
  const totalAmountInRegister = useMemo(() => {
    const inventory = parseFloat(inventoryAmount) || 0;
    const todayMachineIn = parseFloat(machineReadingsSummary.totalTodayIn) || 0;
    const payout = totalPayoutAmount || 0;
    const spinMatch = totalSpinMatchAmount || 0;

    const total = (inventory + todayMachineIn) - (payout + spinMatch);
    return total.toFixed(2);
  }, [inventoryAmount, machineReadingsSummary.totalTodayIn, totalPayoutAmount, totalSpinMatchAmount]);

  const calculateTodayValue = (currentValue: string | null, previousValue: string): string => {
    if (!currentValue) return '-';
    const current = parseFloat(currentValue);
    const previous = parseFloat(previousValue) || 0;
    if (isNaN(current)) return '-';
    const diff = current - previous;
    return diff.toFixed(2);
  };

  // Format time for display (12-hour format)
  const formatTimeDisplay = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Get selected employee name
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const employeeName = selectedEmployee
    ? (selectedEmployee.full_name || `${selectedEmployee.name_first} ${selectedEmployee.name_last}`)
    : '';

  // Get selected shift template name
  const selectedTemplate = shiftTemplates.find(t => t.id === selectedTemplateId);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    const machineRows = machineData.map(machine => {
      const todayIn = calculateTodayValue(machine.total_in, machine.previous_total_in);
      const todayOut = calculateTodayValue(machine.total_out, machine.previous_total_out);
      return `
        <tr>
          <td>${machine.machine_name}</td>
          <td>${machine.machine_type}</td>
          <td>$${machine.total_in || '-'}</td>
          <td>$${machine.total_out || '-'}</td>
          <td>$${todayIn}</td>
          <td>$${todayOut}</td>
        </tr>
      `;
    }).join('');

    const shiftTimeRange = `${formatTimeDisplay(fromTime)} - ${formatTimeDisplay(toTime)}`;
    const shiftName = selectedTemplate ? selectedTemplate.name : 'Custom Shift';

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Shift Report - ${selectedDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            h1 { font-size: 24px; margin: 0 0 8px; }
            h2 { font-size: 18px; margin: 24px 0 16px; color: #333; }
            .date { font-size: 14px; color: #555; margin-bottom: 24px; }
            .shift-time { font-size: 14px; color: #333; margin-bottom: 16px; font-weight: 500; }
            .shift-name { font-size: 14px; color: #0066cc; margin-bottom: 8px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f7f7f7; text-transform: uppercase; letter-spacing: .02em; }
            .summary { background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .summary-label { font-weight: 500; color: #555; }
            .summary-value { font-weight: bold; }
            .total { font-size: 18px; color: #059669; }
            .employee { margin-top: 24px; padding-top: 16px; border-top: 2px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>Shift Report</h1>
          <div class="date">Date: ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div class="shift-name">${shiftName}</div>
          <div class="shift-time">Time: ${shiftTimeRange}</div>
          
          <h2>Machine Readings</h2>
          <table>
            <thead>
              <tr>
                <th>Machine</th>
                <th>Type</th>
                <th>Total IN</th>
                <th>Total OUT</th>
                <th>Today IN</th>
                <th>Today OUT</th>
              </tr>
            </thead>
            <tbody>
              ${machineRows}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Total Today IN (Machines):</span>
              <span class="summary-value">$${machineReadingsSummary.totalTodayIn}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Today OUT (Machines) / Payout:</span>
              <span class="summary-value">$${machineReadingsSummary.totalTodayOut}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Inventory Amount:</span>
              <span class="summary-value">$${inventoryAmount}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Promotional Amount (${formatTimeDisplay(fromTime)} - ${formatTimeDisplay(toTime)}):</span>
              <span class="summary-value">$${totalSpinMatchAmount.toFixed(2)}</span>
            </div>
            <hr style="margin: 16px 0; border: none; border-top: 1px solid #ddd;" />
            <div class="summary-row">
              <span class="summary-label total">Total Amount in Register:</span>
              <span class="summary-value total">$${totalAmountInRegister}</span>
            </div>
          </div>
          
          ${employeeName ? `<div class="employee"><strong>Shift Recorded By:</strong> ${employeeName}</div>` : ''}
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
    win.print();
  };

  if (initialLoading) {
    return <Loading message="Loading..." />;
  }

  return (
    <div>
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Date & Shift Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Shift Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Row 1: Date, Shift Template, Inventory, Shop */}
          <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Input
              type="date"
              label="Report Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSelectedTemplateId(newValue);

                  // Handle custom shift selection
                  if (newValue.startsWith('custom_shift_')) {
                    const customShift = customShifts.find(cs => `custom_shift_${cs.shift_start}` === newValue);
                    if (customShift) {
                      setFromTime(customShift.start_time);
                      setToTime(customShift.end_time);
                      if (customShift.employee_name) {
                        const employee = employees.find(emp =>
                          (emp.full_name || `${emp.name_first} ${emp.name_last}`) === customShift.employee_name
                        );
                        if (employee) {
                          setSelectedEmployeeId(employee.id);
                        }
                        setEmployeeNameFromReading(customShift.employee_name);
                      }
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:text-gray-200"
              >
                <option value="custom">Custom Time</option>
                {shiftTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.display_time})
                  </option>
                ))}
                {customShifts.length > 0 && (
                  <>
                    <option disabled>--- Custom Shifts ---</option>
                    {customShifts.map(customShift => (
                      <option key={`custom_shift_${customShift.shift_start}`} value={`custom_shift_${customShift.shift_start}`}>
                        Custom: {formatTimeDisplay(customShift.start_time)} - {formatTimeDisplay(customShift.end_time)}
                        {customShift.employee_name && ` (${customShift.employee_name})`}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <Input
              type="number"
              label="Inventory Amount ($)"
              value={inventoryAmount}
              onChange={(e) => setInventoryAmount(e.target.value)}
              min="0"
              step="0.01"
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Shop <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedShopId}
                onChange={(e) => {
                  setSelectedShopId(e.target.value);
                  setFieldErrors(prev => ({ ...prev, shop_id: undefined }));
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:text-gray-200 ${fieldErrors.shop_id ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
              >
                <option value="">Select a shop...</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
              {fieldErrors.shop_id && (
                <p className="text-xs font-semibold text-red-600 mt-0.5">{fieldErrors.shop_id}</p>
              )}
            </div>
          </div>

          {/* Row 2: Time selectors (only editable when "Custom Time" is selected, not for custom shifts from dropdown) */}
          {selectedTemplateId === 'custom' && !selectedTemplateId.startsWith('custom_shift_') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Time</label>
                <input
                  type="time"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:text-gray-200"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTimeDisplay(fromTime)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Time</label>
                <input
                  type="time"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:text-gray-200"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTimeDisplay(toTime)}</div>
              </div>
            </div>
          )}

          {/* Display selected shift time if using template */}
          {selectedTemplateId !== 'custom' && !selectedTemplateId.startsWith('custom_shift_') && selectedTemplate && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-400">
                <strong>{selectedTemplate.name}:</strong> {formatTimeDisplay(fromTime)} - {formatTimeDisplay(toTime)}
                {employeeNameFromReading && <span> - {employeeNameFromReading}</span>}
                {selectedTemplate.is_overnight && <span className="ml-2 text-purple-600">(Overnight)</span>}
              </p>
            </div>
          )}

          {/* Display custom shift time if selected from dropdown */}
          {selectedTemplateId.startsWith('custom_shift_') && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-400">
                <strong>Custom Shift:</strong> {formatTimeDisplay(fromTime)} - {formatTimeDisplay(toTime)}
                {employeeNameFromReading && <span> - {employeeNameFromReading}</span>}
              </p>
            </div>
          )}

          {/* Display custom shift time if manually entered */}
          {selectedTemplateId === 'custom' && fromTime && toTime && !selectedTemplateId.startsWith('custom_shift_') && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-400">
                <strong>Custom Shift:</strong> {formatTimeDisplay(fromTime)} - {formatTimeDisplay(toTime)}
                {employeeNameFromReading && <span> - {employeeNameFromReading}</span>}
              </p>
            </div>
          )}

          {/* Row 3: Employee and Get Report button */}
          <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <Select
              label="Employee (for report)"
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

            <div className="min-[500px]:col-span-2 lg:col-span-2">
              <Button
                onClick={handleGetReport}
                loading={loading}
                size="lg"
                className="w-full min-[500px]:w-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Get Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show loading state */}
      {loading && <Loading message="Generating report..." />}

      {/* Report Results - Only show after Get Report is clicked */}
      {reportGenerated && !loading && (
        <>
          {/* Machine Readings Summary */}
          {machineData.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col min-[500px]:flex-row min-[500px]:justify-between min-[500px]:items-center w-full gap-2">
                  <CardTitle className="text-base min-[500px]:text-lg">Machine Readings</CardTitle>
                  {lastReadingDateTime && (
                    <span className="text-xs min-[500px]:text-sm text-gray-500 dark:text-gray-400">
                      Last: {new Date(lastReadingDateTime).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                      })}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Machine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total IN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total OUT</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Today IN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Today OUT</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {machineData.map((machine) => {
                        const todayIn = calculateTodayValue(machine.total_in, machine.previous_total_in);
                        const todayOut = calculateTodayValue(machine.total_out, machine.previous_total_out);

                        return (
                          <tr key={machine.machine_id}>
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-gray-100">
                              {machine.machine_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {machine.machine_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              ${machine.total_in || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              ${machine.total_out || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`font-semibold ${todayIn !== '-' && parseFloat(todayIn) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {todayIn !== '-' ? `$${todayIn}` : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`font-semibold ${todayOut !== '-' && parseFloat(todayOut) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {todayOut !== '-' ? `$${todayOut}` : '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-[500px]:gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inventory Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">${inventoryAmount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Today Machine IN</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">${machineReadingsSummary.totalTodayIn}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payout</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">${totalPayoutAmount.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Promotional Amount</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    ${totalSpinMatchAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatTimeDisplay(fromTime)} - {formatTimeDisplay(toTime)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Amount in Register */}
          <Card className="mb-6">
            <CardContent className="py-6 min-[500px]:py-8">
              <div className="text-center">
                <p className="text-base min-[500px]:text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">Total Amount in Register</p>
                <p className="text-xs min-[500px]:text-sm text-gray-500 dark:text-gray-400 mb-4">
                  (Inv. + Machine IN) - (OUT + Promo)
                </p>
                <p className={`text-3xl min-[500px]:text-4xl font-bold ${parseFloat(totalAmountInRegister) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalAmountInRegister}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Employee Info & Print */}
          <Card>
            <CardContent className="py-4 min-[500px]:py-6">
              <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between gap-3">
                {employeeName ? (
                  <div>
                    <p className="text-xs min-[500px]:text-sm text-gray-500 dark:text-gray-400">Shift Recorded By</p>
                    <p className="text-base min-[500px]:text-lg font-semibold text-gray-900 dark:text-white">{employeeName}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select an employee above to include in report</p>
                )}
                <Button onClick={handlePrint} size="sm" className="w-full min-[500px]:w-auto whitespace-nowrap">
                  <svg className="w-4 h-4 mr-1 min-[500px]:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18h12v-5H6v5z" />
                  </svg>
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Placeholder when no report generated */}
      {!reportGenerated && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Report Generated</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Select date, shift, and shop above, then click <strong>"Get Report"</strong> to generate the shift report.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
