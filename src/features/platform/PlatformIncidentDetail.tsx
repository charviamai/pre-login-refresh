/**
 * PlatformIncidentDetail - Incident detail page for Platform Admins
 * Allows viewing incident details, replying, adding notes, and resolving
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Modal } from '../../shared/components/ui';
import { Loading } from '../../shared/components/Loading';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { platformSupportApi, type Incident, type IncidentMessage } from '../../shared/utils/api-service';

// Badge styling functions
const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary'; label: string }> = {
        OPEN: { variant: 'success', label: 'Open' },
        IN_PROGRESS: { variant: 'info', label: 'In Progress' },
        WAITING_ON_CUSTOMER: { variant: 'warning', label: 'Waiting on Customer' },
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

export const PlatformIncidentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State
    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load incident
    const loadIncident = async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const data = await platformSupportApi.getIncident(id);
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
            await platformSupportApi.replyToIncident(incident.id, replyContent);
            setReplyContent('');
            await loadIncident(); // Reload to get new message
        } catch (err: any) {
            setError(err.message || 'Failed to send reply');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddNote = async () => {
        if (!incident || !noteContent.trim()) return;
        setSubmitting(true);
        try {
            await platformSupportApi.addNote(incident.id, noteContent);
            setNoteContent('');
            await loadIncident();
        } catch (err: any) {
            setError(err.message || 'Failed to add note');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async () => {
        if (!incident || !resolutionNotes.trim()) return;
        setSubmitting(true);
        try {
            await platformSupportApi.resolveIncident(incident.id, resolutionNotes);
            setShowResolveModal(false);
            await loadIncident();
        } catch (err: any) {
            setError(err.message || 'Failed to resolve incident');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = async () => {
        if (!incident) return;
        setSubmitting(true);
        try {
            await platformSupportApi.closeIncident(incident.id);
            await loadIncident();
        } catch (err: any) {
            setError(err.message || 'Failed to close incident');
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

    const getMessageStyle = (type: string) => {
        switch (type) {
            case 'TENANT_REPLY':
                return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
            case 'PLATFORM_REPLY':
                return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500';
            case 'INTERNAL_NOTE':
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500';
            case 'SYSTEM':
                return 'bg-gray-100 dark:bg-gray-800 border-l-4 border-gray-400 italic';
            default:
                return 'bg-white dark:bg-slate-700';
        }
    };

    if (loading) {
        return <Loading message="Loading incident..." />;
    }

    if (!incident) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <h2 className="text-xl font-bold mb-2">Incident Not Found</h2>
                    <Button className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md" onClick={() => navigate('/internal-admin/incidents')}>← Back to Incidents</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="font-mono">{incident.incident_number}</span>
                            <Badge variant={getPriorityBadge(incident.priority).variant}>
                                {getPriorityBadge(incident.priority).label}
                            </Badge>
                            <Badge variant={getStatusBadge(incident.status).variant}>
                                {getStatusBadge(incident.status).label}
                            </Badge>
                        </h1>
                        <p className="text-gray-400 mt-1">{incident.subject}</p>
                    </div>
                    <div className="flex gap-2">
                        {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                            <Button onClick={() => setShowResolveModal(true)} variant="success">
                                Resolve
                            </Button>
                        )}
                        {incident.status === 'RESOLVED' && (
                            <Button onClick={handleClose} className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md" disabled={submitting}>
                                Close Incident
                            </Button>
                        )}
                        <Button size="sm" onClick={() => navigate('/internal-admin/incidents')} className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md text-xs min-[350px]:text-sm">
                            ← Incidents
                        </Button>
                    </div>
                </div>

                {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

                {/* Two column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Messages */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Original Description */}
                        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50">
                            <div className="text-xs text-gray-400 mb-2">
                                {formatDateTime(incident.created_at)} - {incident.contact_name}
                            </div>
                            <div className="text-white whitespace-pre-wrap">{incident.description}</div>
                        </div>

                        {/* Messages */}
                        {incident.messages?.map((msg: IncidentMessage) => (
                            <div key={msg.id} className={`rounded-xl p-4 ${getMessageStyle(msg.message_type)}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {msg.sender_name || 'System'}
                                        </span>
                                        {msg.message_type === 'INTERNAL_NOTE' && (
                                            <span className="ml-2 text-xs bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
                                                Internal Note
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDateTime(msg.created_at)}
                                    </span>
                                </div>
                                <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        ))}

                        {/* Customer Reply Form */}
                        {incident.status !== 'CLOSED' && (
                            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50">
                                <h3 className="text-sm font-semibold text-green-400 uppercase mb-3 flex items-center gap-2">
                                    <span>📧</span> Reply to Customer
                                </h3>
                                <p className="text-xs text-gray-400 mb-3">This reply will be emailed to the tenant.</p>
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Type your reply to the customer..."
                                    rows={4}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white focus:ring-2 focus:ring-green-500"
                                />
                                <div className="flex justify-end mt-3">
                                    <Button onClick={handleSendReply} disabled={!replyContent.trim() || submitting} variant="success">
                                        {submitting ? 'Sending...' : 'Send Reply'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Internal Notes Form */}
                        {incident.status !== 'CLOSED' && (
                            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-yellow-700/50">
                                <h3 className="text-sm font-semibold text-yellow-400 uppercase mb-3 flex items-center gap-2">
                                    <span>📝</span> Internal Notes
                                </h3>
                                <p className="text-xs text-gray-400 mb-3">Internal notes are NOT visible to the tenant.</p>
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="Add internal note for your team..."
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-yellow-700 bg-slate-700 text-white focus:ring-2 focus:ring-yellow-500"
                                />
                                <div className="flex justify-end mt-3">
                                    <Button onClick={handleAddNote} disabled={!noteContent.trim() || submitting} variant="secondary">
                                        {submitting ? 'Adding...' : 'Add Note'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Info Panel */}
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Incident Details</h3>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-gray-400">Category</dt>
                                    <dd className="text-white">{CATEGORIES[incident.category] || incident.category}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-400">Tenant</dt>
                                    <dd className="text-white">{incident.tenant_name || 'Unknown'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-400">Contact</dt>
                                    <dd className="text-white">{incident.contact_name}</dd>
                                    <dd className="text-indigo-400">{incident.contact_email}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-400">Created</dt>
                                    <dd className="text-white">{formatDateTime(incident.created_at)}</dd>
                                </div>
                                {incident.resolved_at && (
                                    <div>
                                        <dt className="text-gray-400">Resolved</dt>
                                        <dd className="text-white">{formatDateTime(incident.resolved_at)}</dd>
                                    </div>
                                )}
                                {incident.resolution_notes && (
                                    <div>
                                        <dt className="text-gray-400">Resolution Notes</dt>
                                        <dd className="text-white whitespace-pre-wrap">{incident.resolution_notes}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Attachments */}
                        {incident.attachments && incident.attachments.length > 0 && (
                            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Attachments</h3>
                                <ul className="space-y-2">
                                    {incident.attachments.map((att) => (
                                        <li key={att.id}>
                                            <a
                                                href={att.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-2"
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

            {/* Resolve Modal */}
            <Modal
                isOpen={showResolveModal}
                onClose={() => setShowResolveModal(false)}
                title="Resolve Incident"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Please provide resolution notes for incident {incident.incident_number}.
                    </p>
                    <div>
                        <textarea
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            placeholder="Describe how the issue was resolved (minimum 10 characters)..."
                            rows={4}
                            className={`w-full px-3 py-2 rounded-lg border ${resolutionNotes.length > 0 && resolutionNotes.length < 10 ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500`}
                        />
                        <div className="flex justify-between mt-1">
                            <span className={`text-xs ${resolutionNotes.length > 0 && resolutionNotes.length < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                                {resolutionNotes.length < 10 ? `Minimum 10 characters required (${10 - resolutionNotes.length} more)` : '✓ Meets minimum length'}
                            </span>
                            <span className="text-xs text-gray-500">{resolutionNotes.length} characters</span>
                        </div>
                    </div>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setShowResolveModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleResolve} disabled={resolutionNotes.trim().length < 10 || submitting} variant="success">
                            {submitting ? 'Resolving...' : 'Resolve Incident'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PlatformIncidentDetail;
