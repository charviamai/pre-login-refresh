/**
 * IncidentDetail - Incident detail page for Tenant Admins
 * View incident details, messages, and add replies
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge } from '../../../shared/components/ui';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { supportApi, type Incident, type IncidentMessage } from '../../../shared/utils/api-service';

// Badge styling functions
const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary'; label: string }> = {
        OPEN: { variant: 'success', label: 'Open' },
        IN_PROGRESS: { variant: 'info', label: 'In Progress' },
        WAITING_ON_CUSTOMER: { variant: 'warning', label: 'Waiting' },
        RESOLVED: { variant: 'success', label: 'Resolved' },
        CLOSED: { variant: 'secondary', label: 'Closed' },
    };
    return badges[status] || { variant: 'secondary', label: status };
};

const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { variant: 'danger' | 'warning' | 'info' | 'secondary'; label: string }> = {
        P1: { variant: 'danger', label: 'P1 - Urgent' },
        P2: { variant: 'warning', label: 'P2 - High' },
        P3: { variant: 'info', label: 'P3 - Normal' },
        P4: { variant: 'secondary', label: 'P4 - Low' },
    };
    return badges[priority] || { variant: 'secondary', label: priority };
};

const CATEGORIES: Record<string, string> = {
    LOGIN: 'Login Issues',
    BILLING: 'Billing & Payments',
    TECHNICAL: 'Technical Issue',
    ACCOUNT: 'Account Management',
    FEATURE: 'Feature Request',
    KIOSK: 'Kiosk Hardware/Software',
    INTEGRATION: 'Integration Issues',
    OTHER: 'Other',
};

export const IncidentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State
    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Load incident
    const loadIncident = async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const data = await supportApi.getIncident(id);
            setIncident(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load incident');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIncident();
    }, [id]);

    const handleSendReply = async () => {
        if (!incident || !replyContent.trim()) return;
        setSubmitting(true);
        try {
            await supportApi.addMessage(incident.id, replyContent);
            setReplyContent('');
            await loadIncident();
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return <Loading message="Loading incident..." />;
    }

    if (!incident) {
        return (
            <PageContainer>
                <div className="text-center py-12">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Incident Not Found</h2>
                    <Button className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md" onClick={() => navigate('/client/support')}>← Back to Incidents</Button>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="mt-6">
                <PageHeader
                    title={
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono">{incident.incident_number}</span>
                            <Badge variant={getPriorityBadge(incident.priority).variant}>
                                {getPriorityBadge(incident.priority).label}
                            </Badge>
                            <Badge variant={getStatusBadge(incident.status).variant}>
                                {getStatusBadge(incident.status).label}
                            </Badge>
                        </div>
                    }
                    subtitle={incident.subject}
                    actions={
                        <Button
                            size="sm"
                            onClick={() => navigate('/client/support')}
                            className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md text-xs min-[350px]:text-sm"
                        >
                            ← My Incidents
                        </Button>
                    }
                />
            </div>

            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

            <div className="max-w-4xl mx-auto mt-6">

                {/* Two column layout on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Conversation Thread */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Initial Incident - Orange Highlight */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-5 border-l-4 border-orange-500 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold">
                                        📝
                                    </span>
                                    <div>
                                        <span className="font-semibold text-orange-700 dark:text-orange-400">Initial Request</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">You opened this incident</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700 px-2 py-1 rounded">
                                    {formatDateTime(incident.created_at)}
                                </span>
                            </div>
                            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed pl-10">
                                {incident.description}
                            </div>
                        </div>

                        {/* Message Thread */}
                        {incident.messages?.filter(m => m.message_type !== 'INTERNAL_NOTE').map((msg: IncidentMessage) => (
                            <div key={msg.id} className={`rounded-xl p-5 shadow-sm ${msg.message_type === 'PLATFORM_REPLY'
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500'
                                : msg.message_type === 'SYSTEM'
                                    ? 'bg-gray-100 dark:bg-gray-800/50 border-l-4 border-gray-400 italic'
                                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500'
                                }`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${msg.message_type === 'PLATFORM_REPLY' ? 'bg-green-500' : 'bg-blue-500'
                                            }`}>
                                            {msg.message_type === 'PLATFORM_REPLY' ? '🎧' : '💬'}
                                        </span>
                                        <div>
                                            {msg.message_type === 'PLATFORM_REPLY' ? (
                                                <>
                                                    <span className="font-semibold text-green-700 dark:text-green-400">Support Team</span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{msg.sender_name}</p>
                                                </>
                                            ) : msg.message_type === 'SYSTEM' ? (
                                                <span className="font-semibold text-gray-600 dark:text-gray-400">System</span>
                                            ) : (
                                                <>
                                                    <span className="font-semibold text-blue-700 dark:text-blue-400">You</span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Your reply</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700 px-2 py-1 rounded">
                                        {formatDateTime(msg.created_at)}
                                    </span>
                                </div>
                                <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed pl-10">
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Reply Form (only if not closed) */}
                        {incident.status !== 'CLOSED' && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span className="text-blue-500">💬</span> Add a Reply
                                </h3>
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Type your message..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <div className="flex justify-end mt-3">
                                    <Button onClick={handleSendReply} disabled={!replyContent.trim() || submitting}>
                                        {submitting ? 'Sending...' : 'Send Message'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {incident.status === 'CLOSED' && (
                            <div className="bg-gray-100 dark:bg-slate-800/50 rounded-xl p-5 text-center">
                                <span className="text-2xl mb-2 block">🔒</span>
                                <p className="text-gray-600 dark:text-gray-400">
                                    This incident is closed. Create a new incident if you need further assistance.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right: Info Panel */}
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Details</h3>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-gray-500 dark:text-gray-400">Category</dt>
                                    <dd className="text-gray-900 dark:text-white">{CATEGORIES[incident.category] || incident.category}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                                    <dd className="text-gray-900 dark:text-white">{formatDateTime(incident.created_at)}</dd>
                                </div>
                                {incident.resolved_at && (
                                    <div>
                                        <dt className="text-gray-500 dark:text-gray-400">Resolved</dt>
                                        <dd className="text-gray-900 dark:text-white">{formatDateTime(incident.resolved_at)}</dd>
                                    </div>
                                )}
                                {incident.resolution_notes && (
                                    <div>
                                        <dt className="text-gray-500 dark:text-gray-400">Resolution</dt>
                                        <dd className="text-gray-900 dark:text-white whitespace-pre-wrap">{incident.resolution_notes}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Attachments */}
                        {incident.attachments && incident.attachments.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Attachments</h3>
                                <ul className="space-y-2">
                                    {incident.attachments.map((att) => (
                                        <li key={att.id}>
                                            <a
                                                href={att.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                {att.filename}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default IncidentDetail;
