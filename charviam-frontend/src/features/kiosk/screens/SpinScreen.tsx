import React, { useState, useRef, useEffect } from 'react';
import { useKiosk } from '../../../contexts/KioskContext';
import { kioskApi } from '../../../shared/utils/api-service';
import type { CampaignSegment } from '../../../shared/types';

// Default color palette for wheel segments (auto-assigned by index)
const DEFAULT_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#34495e', '#f1c40f', '#e67e22'];

export const SpinScreen: React.FC = () => {
  const { performSpin, setState, setMatchAmount, currentCustomer } = useKiosk();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [segments, setSegments] = useState<CampaignSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load campaign and check eligibility
  useEffect(() => {
    const loadCampaign = async () => {
      if (!currentCustomer) {
        setEligibilityError('No customer selected');
        setLoading(false);
        return;
      }

      try {
        const result = await kioskApi.spinEligibility(currentCustomer.id);

        if (!result.can_spin) {
          setEligibilityError(result.reason);
          setLoading(false);
          return;
        }

        if (result.campaign) {
          const sortedSegments = [...result.campaign.segments].sort((a, b) => a.segment_order - b.segment_order);
          setSegments(sortedSegments);
        } else {
          setEligibilityError('No active campaign available');
        }

        setLoading(false);
      } catch (err) {

        setEligibilityError('Failed to load spin wheel. Please try again.');
        setLoading(false);
      }
    };

    loadCampaign();
  }, [currentCustomer]);

  const SEGMENT_ANGLE = segments.length > 0 ? 360 / segments.length : 30;

  // Calculate the rotation needed to land on a specific segment
  const calculateTargetRotation = (targetIndex: number, currentRotation: number): number => {
    const segmentCenterAngleCanvas = -90 + (targetIndex * SEGMENT_ANGLE) + (SEGMENT_ANGLE / 2);
    const rotationToAlign = -90 - segmentCenterAngleCanvas;
    const normalized = ((rotationToAlign % 360) + 360) % 360;
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    return currentRotation + (fullSpins * 360) + normalized;
  };

  // Draw the roulette wheel
  useEffect(() => {
    if (segments.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Draw segments
    segments.forEach((segment, index) => {
      const startAngle = (index * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const endAngle = ((index + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      const textAngle = startAngle + (SEGMENT_ANGLE * Math.PI) / 360;
      ctx.rotate(textAngle);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      ctx.fillText(segment.label, radius - 15, 5);
      ctx.restore();
    });

    // Draw outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Draw inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }, [rotation, segments, SEGMENT_ANGLE]);

  const handleSpin = async () => {
    if (spinning || segments.length === 0) return;
    
    setSpinning(true);
    setShowResult(false);

    try {
      const result = await performSpin();
      if (!result) throw new Error('Spin failed');

      const prizeAmount = result.amount;
      const targetSegmentIndex = result.segment_index;
      setBarcode(result.barcode);
      setExpiresAt(result.expires_at);

      const targetRotation = calculateTargetRotation(targetSegmentIndex, rotation);
      
      const duration = 5000;
      const startTime = Date.now();
      const startRotation = rotation;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRotation = startRotation + (targetRotation - startRotation) * easeOut;
        setRotation(currentRotation % 360);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setWinAmount(prizeAmount);
          setSpinning(false);
          setShowResult(true);
          setTimeout(() => {
            setMatchAmount(prizeAmount);
            setState('PRINTING_TICKET');
          }, 2000);
        }
      };

      requestAnimationFrame(animate);
      
    } catch (err) {

      setSpinning(false);
      setEligibilityError('Spin failed. Please try again.');
    }
  };

  const handleBack = () => {
    setState('MODE_SELECTION');
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳ Loading spin wheel...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (eligibilityError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-3xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4 text-red-400">Cannot Spin</h2>
          <p className="text-lg text-gray-300 mb-6">{eligibilityError}</p>
          <button onClick={handleBack} className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-bold">
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Main spin view - Side by side layout (original styling)
  return (
    <div className="w-full h-full flex items-center">
      <div className="flex w-full gap-8">
        {/* Left side - Wheel */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2 text-yellow-400">
            {spinning ? '🎰 Spinning... 🎰' : '🎰 SPIN THE WHEEL! 🎰'}
          </h1>
          {currentCustomer && (
            <p className="text-lg text-gray-300 mb-4">Welcome, {currentCustomer.name_first} {currentCustomer.name_last || ''}</p>
          )}

          {/* Wheel */}
          <div className="relative inline-block">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
            </div>
            
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="mx-auto"
            />
            
            {/* Center Spin Button */}
            <button
              onClick={handleSpin}
              disabled={spinning || segments.length === 0}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-bold text-base shadow-lg border-4 border-yellow-400 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              {spinning ? (
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent mx-auto" />
              ) : (
                'SPIN'
              )}
            </button>
          </div>

          {/* Back Button */}
          <button
            onClick={handleBack}
            disabled={spinning}
            className="mt-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Right side - Instructions or Result */}
        <div className="w-80 flex flex-col justify-center">
          {showResult ? (
            <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 rounded-xl p-6 border border-green-600">
              <h3 className="font-bold text-2xl mb-3 text-green-400">Congratulations!</h3>
              <p className="text-5xl font-extrabold text-white mb-2">${winAmount}.00</p>
              <p className="text-gray-200">Printing your winning receipt...</p>
              {barcode && (
                <p className="text-sm text-gray-400 mt-2">Barcode: {barcode}</p>
              )}
              {expiresAt && (
                <p className="text-sm text-yellow-400 mt-1">
                  ⏰ Redeem by: {new Date(expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700">
              <h3 className="font-bold text-xl mb-4 text-yellow-400">How to Play</h3>
              <ul className="text-white space-y-3 text-base">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">1.</span>
                  Press the SPIN button in the center
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">2.</span>
                  Watch the wheel spin!
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">3.</span>
                  Win the prize where the pointer lands
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">4.</span>
                  Collect your winning receipt!
                </li>
              </ul>
            </div>
          )}

          <div className="bg-green-900/30 rounded-xl p-5 border border-green-700 mt-4">
            <h3 className="font-bold text-lg mb-3 text-green-400">To Redeem</h3>
            <ul className="text-white space-y-2 text-sm">
              <li>• Take your printed receipt</li>
              <li>• Show it to an employee</li>
              <li>• Employee scans barcode</li>
              <li>• Receive your prize!</li>
            </ul>
          </div>

          {spinning && (
            <div className="mt-4 text-center">
              <span className="text-xl text-yellow-400 animate-pulse">Good luck! 🍀</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
