import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthPageLayout } from '../../shared/components/AuthPageLayout';

interface LocationState {
  requestId?: string;
  emailFailed?: boolean;
}

export const SignupSuccessPage: React.FC = () => {
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const { requestId, emailFailed } = state;

  // Format confirmation number (first 8 chars uppercase)
  const confirmationNumber = requestId?.slice(0, 8).toUpperCase() || 'N/A';

  return (
    <AuthPageLayout showBackLink={false}>
      <div className="glass-card rounded-2xl p-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Thank You for Registering!
          </h2>

          {/* Confirmation Number */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500 mb-1">Your Confirmation Number</p>
            <p className="text-2xl font-bold text-purple-600 tracking-wider">
              {confirmationNumber}
            </p>
          </div>

          {emailFailed ? (
            /* Email Failed State */
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-amber-800 font-medium mb-1">We couldn't send the email right now</p>
                    <p className="text-amber-700 text-sm">
                      Don't worry — our agent will get back to you as soon as possible.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-slate-600 mb-3">Need immediate assistance? Contact us:</p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Email:</span>{' '}
                    <a href="mailto:support@charviam.com" className="text-purple-600 hover:text-purple-500">
                      support@charviam.com
                    </a>
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{' '}
                    <a href="tel:+15551234567" className="text-purple-600 hover:text-purple-500">
                      (555) 123-4567
                    </a>
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Normal Success State */
            <>
              <p className="text-slate-600 mb-6">
                Your registration has been submitted. Please check your email for confirmation.
              </p>

              <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-purple-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Our team will review your application</li>
                  <li>• You'll receive an email with login details</li>
                  <li>• Your account will be activated within 24-48 hours</li>
                </ul>
              </div>
            </>
          )}

          <Link
            to="/"
            className="inline-block text-purple-600 hover:text-purple-500 font-medium transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </AuthPageLayout>
  );
};
