import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../shared/components/ui';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { ErrorBanner } from '../../shared/components/ErrorBanner';

export const ChangePasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'questions' | 'password'>('questions');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Security Questions State
    const [answer1, setAnswer1] = useState('');
    const [answer2, setAnswer2] = useState('');
    const [answer3, setAnswer3] = useState('');

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const securityQuestions = [
        { id: 'CITY', label: 'What is your favorite city?' },
        { id: 'FOOD', label: 'What is your favourite type of food?' },
        { id: 'DESSERT', label: 'What is your favourite dessert?' },
    ];

    const handleVerifyQuestions = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // TODO: Call API to verify security questions
            // const response = await authApi.verifySecurityQuestions({ answer1, answer2, answer3 });

            // For now, just move to next step (implement API later)
            setStep('password');
        } catch (err: any) {
            setError(err.message || 'Security questions verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            // TODO: Call API to change password
            // await authApi.changePassword({ newPassword });

            setSuccess('Password changed successfully! Redirecting...');
            setTimeout(() => navigate(-1), 2000); // Go back after showing message
        } catch (err: any) {
            setError(err.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer maxWidth="md">
            <PageHeader
                title="Change Password"
                subtitle="Verify your identity to change your password"
            />

            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
            {success && (
                <div className="my-3 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-green-800">{success}</span>
                </div>
            )}

            {step === 'questions' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Security Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVerifyQuestions} className="space-y-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Please answer your security questions to verify your identity.
                            </p>

                            {securityQuestions.map((q, index) => (
                                <div key={q.id}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {q.label}
                                    </label>
                                    <input
                                        type="text"
                                        value={index === 0 ? answer1 : index === 1 ? answer2 : answer3}
                                        onChange={(e) => {
                                            if (index === 0) setAnswer1(e.target.value);
                                            else if (index === 1) setAnswer2(e.target.value);
                                            else setAnswer3(e.target.value);
                                        }}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            ))}

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)} fullWidth>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={loading} fullWidth>
                                    Verify & Continue
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Set New Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <p className="text-sm text-green-600 mb-4">
                                ✓ Security questions verified
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setStep('questions')} fullWidth>
                                    Back
                                </Button>
                                <Button type="submit" loading={loading} fullWidth>
                                    Change Password
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </PageContainer>
    );
};
