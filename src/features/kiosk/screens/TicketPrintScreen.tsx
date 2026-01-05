import React, { useEffect, useState, useMemo } from 'react';
import { useKiosk } from '../../../contexts/KioskContext';

// Generate a 16-digit barcode number
const generateBarcodeNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return timestamp + random;
};

// Format date as MM/DD/YYYY HH:MM:SS AM/PM
const formatTimestamp = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours.toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${month}/${day}/${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
};

// Convert UTC ISO string from backend to local timezone Date
const parseUTCToLocal = (utcString: string): Date => {
  // JavaScript Date constructor handles ISO strings and converts to local timezone
  return new Date(utcString);
};

export const TicketPrintScreen: React.FC = () => {
  const { currentCustomer, matchAmount, config, deviceInfo, reset, state: _state, currentTicket } = useKiosk();
  const [countdown, setCountdown] = useState(6);
  const [isPrinting, setIsPrinting] = useState(true);

  // Generate barcode once on mount
  const barcodeNumber = useMemo(() => generateBarcodeNumber(), []);
  const timestamp = useMemo(() => new Date(), []);
  
  // Calculate next available time - prefer backend value, fallback to client calculation
  const nextAvailableAt = useMemo(() => {
    if (currentTicket?.nextAvailableAt) {
      // Backend provides UTC ISO string, convert to local
      return parseUTCToLocal(currentTicket.nextAvailableAt);
    }
    // Fallback: calculate from current time + cooldown hours
    const cooldownHours = config?.promotion?.match_cooldown_hours || 8;
    return new Date(timestamp.getTime() + cooldownHours * 60 * 60 * 1000);
  }, [currentTicket?.nextAvailableAt, config?.promotion?.match_cooldown_hours, timestamp]);

  // Get store and device info
  const storeName = config?.shop?.name || deviceInfo?.shop_name || 'Store';
  const deviceName = config?.device?.name || deviceInfo?.name || 'Kiosk';
  const customerName = currentCustomer ? `${currentCustomer.name_first} ${currentCustomer.name_last || ''}`.trim() : 'Guest';
  const customerPhone = currentCustomer?.phone || '';

  // Consistent amount from ticket or match amount
  const displayAmount = (currentTicket?.amount ?? matchAmount ?? 0);
  const receiptTitle = currentTicket?.issued_by_mode === 'SPIN' ? 'SPIN RECEIPT' : 'MATCH RECEIPT';

  // Simulate printing
  useEffect(() => {
    const printTimer = setTimeout(() => {
      setIsPrinting(false);
    }, 2000);
    return () => clearTimeout(printTimer);
  }, []);

  // Countdown to reset
  useEffect(() => {
    if (!isPrinting && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      reset();
    }
  }, [countdown, isPrinting, reset]);

  // Printing animation
  if (isPrinting) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-10 h-10 text-white animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Printing Receipt...</h1>
          <p className="text-lg text-gray-300">Please wait</p>
          <div className="mt-6 max-w-xs mx-auto">
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <div className="bg-green-500 h-full animate-pulse" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center">
      <div className="flex w-full gap-6">
        {/* Left side - Receipt Preview */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-400">Receipt Printed!</h1>
            <p className="text-gray-300">Take your receipt from the printer</p>
          </div>

          {/* Receipt Preview */}
          <div className="bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden" style={{ width: '320px' }}>
            {/* Receipt Header */}
            <div className="bg-gray-100 px-4 py-3 border-b-2 border-dashed border-gray-300">
              <h2 className="text-xl font-bold text-center text-gray-800">{storeName}</h2>
              <p className="text-xs text-center text-gray-500">{receiptTitle}</p>
            </div>

            {/* Receipt Body */}
            <div className="px-4 py-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Device:</span>
                <span className="font-medium">{deviceName}</span>
              </div>
              <div className="border-t border-dashed border-gray-300" />
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{customerName}</span>
              </div>
              {customerPhone && !customerPhone.startsWith('+1') && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{customerPhone}</span>
                </div>
              )}
              <div className="border-t border-dashed border-gray-300" />

              {/* Prize/Match Amount */}
              <div className="py-3 text-center">
                <p className="text-xs text-gray-500 mb-1">AMOUNT</p>
                <p className="text-4xl font-bold text-green-600">${displayAmount.toFixed(2)}</p>
              </div>

              <div className="border-t border-dashed border-gray-300" />
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Date/Time:</span>
                <span className="font-mono">{formatTimestamp(timestamp)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-600 font-bold">Next Available:</span>
                <span className="font-mono font-bold">{formatTimestamp(nextAvailableAt)}</span>
              </div>
            </div>

            {/* Barcode Section */}
            <div className="bg-gray-50 px-4 py-4 border-t-2 border-dashed border-gray-300">
              <div className="bg-white border border-gray-200 rounded p-3">
                <div className="flex justify-center items-center h-12 space-x-0.5">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const charCode = barcodeNumber.charCodeAt(i % 16) || 48;
                    const width = (charCode % 3) + 1;
                    return (
                      <div key={i} className="bg-gray-900" style={{ width: `${width}px`, height: '100%' }} />
                    );
                  })}
                </div>
                <p className="text-center font-mono text-sm tracking-widest mt-2 text-gray-800">
                  {barcodeNumber.match(/.{1,4}/g)?.join(' ')}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 px-4 py-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">Thank you for playing!</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Returning to home in <span className="font-bold text-white">{countdown}</span>s
            </p>
            <button onClick={() => reset()} className="mt-1 text-primary-400 hover:text-primary-300 underline text-sm">
              Done
            </button>
          </div>
        </div>

        {/* Right side - Instructions */}
        <div className="w-72 flex flex-col justify-center">
          <div className="bg-green-900/30 border border-green-600 rounded-xl p-5">
            <h3 className="font-bold text-xl text-green-400 mb-4">Next Steps</h3>
            <ol className="text-white space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span>Take your printed receipt</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span>Bring it to an employee</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span>Employee scans the barcode</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                <span>Receive your ${displayAmount.toFixed(2)} prize!</span>
              </li>
            </ol>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-600 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-bold">Important</span>
            </div>
            <p className="text-yellow-200 text-sm mt-2">
              Keep your receipt safe! It's required for redemption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
