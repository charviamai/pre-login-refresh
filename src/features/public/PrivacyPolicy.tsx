import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../shared/components/layout';

export const PrivacyPolicy: React.FC = () => {
    return (
        <PublicLayout>
            <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12 animate-slide-up-fade">
                        <Link
                            to="/"
                            className="inline-block mb-6 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                            ← Back to Home
                        </Link>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Effective Date: January 1, 2026
                        </p>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 md:p-12 space-y-8 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>

                        {/* Introduction */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">Introduction</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                At ArcadeX ("we," "us," or "our"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our gaming arcade management platform (the "Service").
                            </p>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                By using our Service, you consent to the data practices described in this policy. If you do not agree with our practices, please do not use the Service.
                            </p>
                        </section>

                        {/* Section 1 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">1. Information We Collect</h2>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">1.1 Information You Provide</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                We collect information that you voluntarily provide when using our Service:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4 mb-4">
                                <li><strong>Registration Information:</strong> Name, email address, phone number, business name, and shop address</li>
                                <li><strong>Account Security:</strong> Password (encrypted), security questions and answers (hashed)</li>
                                <li><strong>Business Data:</strong> Employee information, customer data, shop locations, and operational details</li>
                                <li><strong>Payment Information:</strong> Billing address and payment method details (processed securely by our payment provider)</li>
                                <li><strong>Biometric Data:</strong> Palm prints and facial recognition data for customer authentication (if enabled)</li>
                            </ul>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">1.2 Automatically Collected Information</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                We automatically collect certain information when you use the Service:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                                <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and interaction patterns</li>
                                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                                <li><strong>Log Data:</strong> Access times, error logs, and performance metrics</li>
                                <li><strong>Cookies:</strong> Session cookies, authentication tokens, and preference settings</li>
                            </ul>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">2. How We Use Your Information</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                We use the information we collect for the following purposes:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                                <li><strong>Service Delivery:</strong> To provide, maintain, and improve the platform functionality</li>
                                <li><strong>Account Management:</strong> To create and manage your account, authenticate users, and process transactions</li>
                                <li><strong>Customer Support:</strong> To respond to inquiries, resolve issues, and provide technical assistance</li>
                                <li><strong>Security:</strong> To detect, prevent, and address fraud, security threats, and policy violations</li>
                                <li><strong>Analytics:</strong> To analyze usage patterns, improve user experience, and develop new features</li>
                                <li><strong>Communications:</strong> To send service updates, security alerts, and promotional materials (with your consent)</li>
                                <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">3. Data Security Measures</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                We implement industry-standard security measures to protect your information:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4 mb-4">
                                <li><strong>Encryption:</strong> All data in transit is encrypted using TLS/SSL protocols</li>
                                <li><strong>Password Security:</strong> Passwords are hashed using Argon2 algorithm</li>
                                <li><strong>Access Controls:</strong> Role-based access control (RBAC) limits data access to authorized personnel</li>
                                <li><strong>Regular Audits:</strong> Periodic security assessments and penetration testing</li>
                                <li><strong>Secure Infrastructure:</strong> Data stored in secure, redundant data centers with 24/7 monitoring</li>
                                <li><strong>Employee Training:</strong> Staff trained on data protection and privacy best practices</li>
                            </ul>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                While we strive to protect your information, no method of transmission or storage is 100% secure. We cannot guarantee absolute security but will notify you of any data breaches as required by law.
                            </p>
                        </section>

                        {/* Section 4 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">4. Information Sharing and Disclosure</h2>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">4.1 Third-Party Service Providers</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                We may share your information with trusted third-party service providers who assist us in operating the Service:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4 mb-4">
                                <li>Payment processors (for billing and subscription management)</li>
                                <li>Cloud hosting providers (for data storage and infrastructure)</li>
                                <li>Email service providers (for transactional and marketing communications)</li>
                                <li>Analytics providers (for usage analysis and service improvement)</li>
                            </ul>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                These providers are contractually obligated to protect your data and use it only for the specified purposes.
                            </p>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">4.2 Legal Requirements</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                We may disclose your information if required by law or in good faith belief that such action is necessary to:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                                <li>Comply with legal obligations, court orders, or subpoenas</li>
                                <li>Protect and defend our rights or property</li>
                                <li>Prevent fraud or security threats</li>
                                <li>Protect the safety of users or the public</li>
                            </ul>
                        </section>

                        {/* Section 5 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">5. Your Privacy Rights</h2>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">5.1 Access and Correction</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                You have the right to access and update your personal information at any time through your account settings. If you need assistance, contact our support team.
                            </p>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">5.2 Data Portability</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                You have the right to request a copy of your data in a structured, machine-readable format. We will provide this within 30 days of your request.
                            </p>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">5.3 Data Deletion</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                You may request deletion of your personal information by contacting us. We will delete your data within 90 days, except where retention is required by law or for legitimate business purposes (e.g., accounting, dispute resolution).
                            </p>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">5.4 Marketing Communications</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                You may opt out of marketing emails by clicking the "unsubscribe" link in any promotional email or by updating your communication preferences in your account settings. Note that you cannot opt out of transactional or service-related emails.
                            </p>
                        </section>

                        {/* Section 6 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">6. Cookies and Tracking Technologies</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                We use cookies and similar tracking technologies to enhance your experience:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4 mb-4">
                                <li><strong>Essential Cookies:</strong> Required for authentication, security, and basic functionality</li>
                                <li><strong>Performance Cookies:</strong> Help us understand how you use the Service and identify areas for improvement</li>
                                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                            </ul>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                You can control cookies through your browser settings, but disabling certain cookies may affect Service functionality.
                            </p>
                        </section>

                        {/* Section 7 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">7. Data Retention</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                We retain your personal information for as long as necessary to provide the Service and fulfill the purposes described in this policy. Specific retention periods include:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                                <li>Account information: Until account deletion or 3 years after last activity</li>
                                <li>Transaction records: 7 years for tax and accounting purposes</li>
                                <li>Support tickets: 3 years after resolution</li>
                                <li>Analytics data: Aggregated and anonymized after 2 years</li>
                            </ul>
                        </section>

                        {/* Section 8 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">8. Children's Privacy</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                Our Service is not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately, and we will delete it.
                            </p>
                        </section>

                        {/* Section 9 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">9. International Data Transfers</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                Your information may be transferred to and processed in countries other than your country of residence. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards, such as Standard Contractual Clauses.
                            </p>
                        </section>

                        {/* Section 10 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">10. Changes to This Policy</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a notice on the Service at least 30 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        {/* Section 11 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">11. Contact Us</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6 space-y-2">
                                <p className="text-slate-700 dark:text-slate-300"><strong>Privacy Officer:</strong> privacy@charviam.com</p>
                                <p className="text-slate-700 dark:text-slate-300"><strong>General Inquiries:</strong> contact@charviam.com</p>
                                <p className="text-slate-700 dark:text-slate-300"><strong>Mailing Address:</strong> Charviam Inc., TX, USA</p>
                            </div>
                        </section>

                        {/* GDPR/CCPA Notice */}
                        <section className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Your California & EU Privacy Rights</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                <strong>California Residents (CCPA):</strong> California law provides additional rights regarding personal information, including the right to know what information we collect, the right to delete information, and the right to opt-out of the "sale" of personal information (we do not sell your data).
                            </p>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                <strong>EU Residents (GDPR):</strong> If you are in the European Economic Area, you have additional rights including the right to object to processing, the right to restrict processing, and the right to lodge a complaint with your local data protection authority.
                            </p>
                        </section>

                        {/* Footer */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-8 mt-12">
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                                Last Updated: January 1, 2026 | © 2026 Charviam Inc. All rights reserved.
                            </p>
                        </div>
                    </div>

                    {/* Back to signup */}
                    <div className="text-center mt-8">
                        <Link
                            to="/signup"
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                        >
                            Back to Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};
