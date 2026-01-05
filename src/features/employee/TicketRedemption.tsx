import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge, Modal } from '../../shared/components/ui';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { Loading } from '../../shared/components/Loading';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { employeeApi } from '../../shared/utils/api-service';
import { useAuth } from '../../contexts/AuthContext';
import type { Ticket, TicketValidationResult } from '../../shared/types';
import { Html5Qrcode } from 'html5-qrcode';

// Response type from current_status endpoint
interface ClockStatus {
  clocked_in: boolean;
  clock_in_time?: string;
  entry_id?: string;
  shop_id?: string;
}

// Cancellation reasons
const CANCELLATION_REASONS = [
  'Customer request',
  'Wrong ticket scanned',
  'System error - retry needed',
  'Duplicate ticket',
  'Testing/Training',
  'Other (specify below)',
];

export const TicketRedemption: React.FC = () => {
  const { user: _user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [ticketCode, setTicketCode] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [validation, setValidation] = useState<TicketValidationResult | null>(null);
  const [activeShift, setActiveShift] = useState<ClockStatus | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Messages
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Camera scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Confirmation modal state
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonOther, setCancelReasonOther] = useState('');

  useEffect(() => {
    checkActiveShift();
    return () => {
      // Cleanup scanner on unmount
      stopScanner();
    };
  }, []);

  const checkActiveShift = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getActiveShift();
      if (response && (response as any).clocked_in) {
        setActiveShift(response as ClockStatus);
      } else {
        setActiveShift(null);
      }
    } catch (err: any) {
      if (err.status_code === 404) {
        setError('You must have an active shift to redeem tickets. Please start a shift first.');
      } else {
        setError(err.message || 'Failed to load shift data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Camera Scanner Functions
  // Camera Scanner Functions
  const startScanner = async () => {
    setScannerError(null);
    setShowScanner(true);

    // Wait for DOM to update and container to be present
    setTimeout(async () => {
      try {
        // Double check container exists
        if (!document.getElementById('scanner-container')) {
          throw new Error("Scanner container initialization failed");
        }

        // Initialize scanner with native BarcodeDetector support
        const scanner = new Html5Qrcode(
          'scanner-container',
          {
            verbose: false,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          }
        );
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            // Success - code scanned
            setTicketCode(decodedText);
            stopScanner();
            // Auto-lookup after scan
            handleLookupWithCode(decodedText);
          },
          () => {
            // QR code parse error (scanning in progress)
          }
        );
      } catch (err: any) {
        console.error("Scanner Error:", err);
        setScannerError(err.message || 'Failed to access camera. Ensure permissions are allowed and you are using HTTPS/Localhost.');
        // We keep showScanner(true) so the error message is visible
      }
    }, 100);
  };

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => { /* Ignore stop errors */ });
      scannerRef.current = null;
    }
    setShowScanner(false);
  }, []);

  const handleLookupWithCode = async (code: string) => {
    if (!code.trim() || !activeShift?.clocked_in) return;

    setLookupLoading(true);
    setError(null);
    setSuccessMessage(null);
    setTicket(null);
    setValidation(null);

    try {
      const result = await employeeApi.lookupTicket(code.trim());
      setTicket(result.ticket);
      setValidation(result.validation || null);
    } catch (err: any) {
      setError(err.message || 'Failed to lookup ticket');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleLookupTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) {
      setError('Please enter a ticket code');
      return;
    }
    if (!activeShift?.clocked_in) {
      setError('You must have an active shift to look up tickets');
      return;
    }
    await handleLookupWithCode(ticketCode);
  };

  // Redeem with confirmation
  const handleRedeemClick = () => {
    if (!ticket || !validation?.is_valid) return;
    setShowRedeemConfirm(true);
  };

  const handleConfirmRedeem = async () => {
    if (!ticket || !activeShift?.clocked_in) return;

    setRedeemLoading(true);
    setError(null);
    setSuccessMessage(null);
    setShowRedeemConfirm(false);

    try {
      await employeeApi.redeemTicket(ticket.id);
      setSuccessMessage(
        `Ticket successfully redeemed! Customer received $${ticket.payout_amount ?? ticket.amount}.`
      );
      // Clear form after successful redemption
      setTimeout(() => {
        handleClear();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to redeem ticket');
    } finally {
      setRedeemLoading(false);
    }
  };

  // Cancel ticket
  const handleCancelClick = () => {
    if (!ticket) return;
    setCancelReason('');
    setCancelReasonOther('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!ticket) return;

    const reason = cancelReason === 'Other (specify below)'
      ? cancelReasonOther.trim()
      : cancelReason;

    if (!reason) {
      setError('Please select or enter a cancellation reason');
      return;
    }

    setCancelLoading(true);
    setError(null);
    setShowCancelModal(false);

    try {
      await employeeApi.cancelTicket(ticket.id, reason);
      setSuccessMessage('Ticket cancelled successfully. Customer can play again.');
      setTimeout(() => {
        handleClear();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel ticket');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleClear = () => {
    setTicketCode('');
    setTicket(null);
    setValidation(null);
    setError(null);
    setSuccessMessage(null);
  };

  if (loading) return <Loading message="Loading redemption portal..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="container-custom flex items-start justify-between gap-2 py-3 sm:py-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Ticket Redemption</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
              Scan or enter ticket codes to validate and redeem
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/employee/dashboard')} className="flex-shrink-0">
            <span className="sm:hidden">← Back</span>
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
        </div>
      </header>

      <PageContainer>
        {/* Shift Status Banner */}
        {!activeShift?.clocked_in && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">No Active Shift</p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You must start a shift before you can redeem tickets.{' '}
                  <button onClick={() => navigate('/employee/dashboard')} className="underline hover:no-underline font-medium">
                    Start shift now
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeShift?.clocked_in && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">Shift Active</p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Started at {activeShift.clock_in_time ? new Date(activeShift.clock_in_time).toLocaleTimeString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-semibold text-green-900">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Camera Scanner */}
        {showScanner && (
          <Card className="mb-4 sm:mb-6 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Camera Scanner</CardTitle>
                <Button variant="secondary" size="sm" onClick={stopScanner}>
                  Close Camera
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scannerError ? (
                <div className="text-center p-4 text-red-600">{scannerError}</div>
              ) : (
                <div id="scanner-container" ref={scannerContainerRef} className="w-full max-w-md mx-auto" />
              )}
            </CardContent>
          </Card>
        )}

        {/* Ticket Lookup Form */}
        <Card className="mb-4 sm:mb-6 dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg">Lookup Ticket</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleLookupTicket} className="space-y-3 sm:space-y-4">
              <div>
                <Input
                  label="Ticket Code"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="Enter or scan ticket code"
                  disabled={!activeShift || lookupLoading}
                  autoFocus
                  fullWidth
                />
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use camera or barcode scanner, or enter manually
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  type="submit"
                  loading={lookupLoading}
                  disabled={!activeShift || !ticketCode.trim()}
                  className="text-sm sm:text-base"
                >
                  Lookup Ticket
                </Button>

                {/* Camera Scan Button */}
                {!showScanner && activeShift?.clocked_in && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startScanner}
                    className="text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Scan with Camera
                  </Button>
                )}

                {(ticket || ticketCode) && (
                  <Button type="button" variant="secondary" onClick={handleClear} className="text-sm sm:text-base">
                    Clear
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Ticket Details */}
        {ticket && validation && (
          <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ticket Details</CardTitle>
                <Badge variant={validation.is_valid ? 'success' : 'danger'}>
                  {validation.is_valid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Validation Messages */}
                {!validation.is_valid && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h4 className="text-sm font-semibold text-red-900 mb-2">Cannot Redeem - Validation Failed</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      {validation.validation_messages.map((message, idx) => (
                        <li key={idx}>• {message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.is_valid && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm font-semibold text-green-900">✓ Ticket is valid and ready to redeem</p>
                  </div>
                )}

                {/* Ticket Information Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Ticket Code</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{ticket.ticket_code}</p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Payout Amount</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      ${(ticket.payout_amount ?? ticket.amount ?? 0).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {ticket.customer_first_name} {ticket.customer_last_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Age</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{ticket.customer_age ?? 'N/A'} years</p>
                    {(ticket.customer_age ?? 0) < 21 && (
                      <p className="text-xs text-red-600 mt-1">⚠ Under 21</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Game Mode</p>
                    <Badge variant="info">{ticket.mode}</Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <Badge
                      variant={
                        ticket.status === 'UNREDEEMED' || ticket.status === 'PENDING'
                          ? 'warning'
                          : ticket.status === 'REDEEMED'
                            ? 'success'
                            : 'danger'
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Issued At</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : new Date(ticket.issued_at).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expires At</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {ticket.expires_at ? new Date(ticket.expires_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t space-y-3">
                  {validation.is_valid && (
                    <Button
                      onClick={handleRedeemClick}
                      loading={redeemLoading}
                      size="lg"
                      fullWidth
                    >
                      Redeem Ticket - Pay ${(ticket.payout_amount ?? ticket.amount ?? 0).toFixed(2)}
                    </Button>
                  )}

                  {/* Cancel Button - only for UNREDEEMED/PENDING status */}
                  {(ticket.status === 'UNREDEEMED' || ticket.status === 'PENDING') && (
                    <Button
                      onClick={handleCancelClick}
                      loading={cancelLoading}
                      variant="outline"
                      size="lg"
                      fullWidth
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Cancel Ticket
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="py-3 sm:py-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-md p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1.5 sm:mb-2">
                Redemption Instructions:
              </h4>
              <ol className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-0.5 sm:space-y-1 list-decimal list-inside">
                <li>Customer presents winning ticket</li>
                <li>Scan barcode or enter ticket code</li>
                <li>Verify customer identity (21+)</li>
                <li>Review ticket details and payout</li>
                <li>Click "Redeem Ticket" to process</li>
                <li>Provide cash and confirm</li>
              </ol>
              <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 mt-2 sm:mt-3">
                <strong>Note:</strong> All redemptions and cancellations are logged.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>

      {/* Redeem Confirmation Modal */}
      {showRedeemConfirm && ticket && (
        <Modal
          isOpen={showRedeemConfirm}
          onClose={() => setShowRedeemConfirm(false)}
          title="Confirm Redemption"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-center text-2xl font-bold text-green-700 mb-2">
                ${(ticket.payout_amount ?? ticket.amount ?? 0).toFixed(2)}
              </p>
              <p className="text-center text-sm text-green-800">
                Pay this amount to the customer
              </p>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Customer:</strong> {ticket.customer_first_name} {ticket.customer_last_name}</p>
              <p><strong>Ticket:</strong> {ticket.ticket_code}</p>
              <p><strong>Game:</strong> {ticket.mode}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowRedeemConfirm(false)}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRedeem}
                loading={redeemLoading}
                fullWidth
              >
                Confirm Redemption
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Ticket Modal */}
      {showCancelModal && ticket && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Ticket"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Cancelling this ticket will void the prize and allow the customer to play again.
              </p>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Ticket:</strong> {ticket.ticket_code}</p>
              <p><strong>Amount:</strong> ${(ticket.payout_amount ?? ticket.amount ?? 0).toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a reason...</option>
                {CANCELLATION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            {cancelReason === 'Other (specify below)' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specify Reason *
                </label>
                <textarea
                  value={cancelReasonOther}
                  onChange={(e) => setCancelReasonOther(e.target.value)}
                  placeholder="Enter cancellation reason..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(false)}
                fullWidth
              >
                Keep Ticket
              </Button>
              <Button
                onClick={handleConfirmCancel}
                loading={cancelLoading}
                fullWidth
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
