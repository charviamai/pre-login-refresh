import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../shared/components/ui';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { ErrorBanner } from '../../shared/components/ErrorBanner';

export const ManageLoginAccessPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleVerifyPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // TODO: Call API to verify current password
            // const response = await authApi.verifyCurrentPassword({ password });

            // For now, just authenticate (implement API later)
            setAuthenticated(true);
        } catch (err: any) {
            setError(err.message || 'Incorrect password');
        } finally {
            setLoading(false);
        }
    };

    const securityQuestions = [
        { id: 'CITY', label: 'What is your favorite city?' },
        { id: 'FOOD', label: 'What is your favourite type of food?' },
        { id: 'DESSERT', label: 'What is your favourite dessert?' },
    ];

    return (
        <PageContainer maxWidth="md">
            <PageHeader
                title="Manage Login Access"
                subtitle="View your account information and security settings"
            />

            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

            {!authenticated ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Verify Your Identity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVerifyPassword} className="space-y-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Enter your current password to access your login information.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your password"
                                />
                            </div>

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
                <div className="space-y-6">
                    {/* Account Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Email
                                    </label>
                                    <p className="text-gray-900">{user?.email || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Email
                                    </label>
                                    <p className="text-gray-900">{user?.email || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        First Name
                                    </label>
                                    <p className="text-gray-900">{user?.name_first || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Last Name
                                    </label>
                                    <p className="text-gray-900">{user?.name_last || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Role
                                    </label>
                                    <p className="text-gray-900">{user?.role || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Account Created
                                    </label>
                                    <p className="text-gray-900">
                                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Questions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Questions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Your security questions are set. Answers are hidden for security.
                            </p>
                            <div className="space-y-3">
                                {securityQuestions.map((q, _index) => (
                                    <div key={q.id} className="flex items-center gap-2">
                                        <span className="text-blue-600">✓</span>
                                        <span className="text-gray-700">{q.label}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={() => navigate(-1)}>
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </PageContainer>
    );
};
