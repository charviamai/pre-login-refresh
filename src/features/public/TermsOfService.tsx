import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../shared/components/layout';

export const TermsOfService: React.FC = () => {
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
                            Terms of Service
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Effective Date: January 1, 2026
                        </p>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 md:p-12 space-y-8 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>

                        {/* Section 1 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">1. Introduction and Acceptance</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                Welcome to ArcadeX Gaming Platform ("ArcadeX," "we," "us," or "our"). These Terms of Service ("Terms") govern your access to and use of our multi-tenant gaming management platform, including all associated services, software, and applications (collectively, the "Service").
                            </p>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                By creating an account, accessing, or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Service.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">2. Service Description</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                ArcadeX provides a comprehensive gaming arcade management platform designed for business owners operating gaming establishments. Our Service includes, but is not limited to:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                                <li>Multi-location shop management and administration</li>
                                <li>Employee portal for shift scheduling, time tracking, and ticket redemption</li>
                                <li>Customer management and biometric authentication systems</li>
                                <li>Kiosk interface for customer gaming experiences</li>
                                <li>Real-time reporting, analytics, and business intelligence</li>
                                <li>Device management and activation tools</li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">3. Account Registration and Security</h2>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">3.1 Account Creation</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                To use the Service, you must create an account by providing accurate, complete, and current information. You represent and warrant that:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4 mb-4">
                                <li>All information you provide is truthful and accurate</li>
                                <li>You are legally authorized to enter into this agreement</li>
                                <li>You have the authority to bind your business entity to these Terms</li>
                                <li>Your use of the Service complies with all applicable laws and regulations</li>
                            </ul>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">3.2 Account Security</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                You are responsible for maintaining the confidentiality of your account credentials, including your password and security question answers. You agree to:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                                <li>Use a strong, unique password that meets our security requirements</li>
                                <li>Never share your password or account access with unauthorized individuals</li>
                                <li>Immediately notify us of any unauthorized access or security breach</li>
                                <li>Accept full responsibility for all activities conducted under your account</li>
                            </ul>
                        </section>

                        {/* Section 4 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">4. User Obligations and Prohibited Conduct</h2>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">4.1 Acceptable Use</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                You agree to use the Service only for lawful purposes and in accordance with these Terms. You will not:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4 mb-4">
                                <li>Violate any applicable local, state, national, or international law or regulation</li>
                                <li>Infringe upon or misappropriate any intellectual property rights</li>
                                <li>Transmit any viruses, malware, or other malicious code</li>
                                <li>Attempt to gain unauthorized access to our systems or networks</li>
                                <li>Engage in any activity that disrupts or interferes with the Service</li>
                                <li>Reverse engineer, decompile, or disassemble any portion of the Service</li>
                                <li>Use the Service to harass, abuse, or harm another person or entity</li>
                            </ul>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">4.2 Business Compliance</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                You are solely responsible for ensuring that your use of the Service complies with all applicable gaming, entertainment, data protection, and business operation laws in your jurisdiction. This includes, but is not limited to, age verification requirements, prize distribution regulations, and tax reporting obligations.
                            </p>
                        </section>

                        {/* Section 5 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">5. Data Collection and Privacy</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to our data practices as described in the Privacy Policy.
                            </p>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                We implement industry-standard security measures to protect your data, including encryption, access controls, and regular security audits. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </section>

                        {/* Section 6 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">6. Payment Terms and Billing</h2>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">6.1 Subscription Plans</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                Access to the Service requires a paid subscription. Subscription fees are billed in advance on a monthly or annual basis, as selected during registration. All fees are non-refundable except as expressly stated in these Terms or required by law.
                            </p>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">6.2 Automatic Renewal</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                Your subscription will automatically renew at the end of each billing period unless you cancel before the renewal date. We will charge your payment method on file for the applicable subscription fee.
                            </p>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                Payment must be received within seven (7) calendar days of the billing date. Failure to remit payment within this grace period will result in immediate suspension of Service access until payment is received. We reserve the right to terminate accounts with repeated late payments after providing reasonable notice.
                            </p>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">6.3 Price Changes</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                We reserve the right to modify subscription pricing with at least 30 days' advance notice. Price changes will not affect your current billing cycle but will apply to subsequent renewal periods.
                            </p>
                        </section>

                        {/* Section 7 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">7. Intellectual Property Rights</h2>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">7.1 Our Property</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                The Service, including all software, text, graphics, logos, icons, images, audio clips, and other content, is owned by ArcadeX and is protected by U.S. and international copyright, trademark, and other intellectual property laws. All rights not expressly granted to you are reserved by ArcadeX.
                            </p>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">7.2 Your Content</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                You retain ownership of any content you submit to the Service ("User Content"), including business data, customer information, and reports. By submitting User Content, you grant us a limited, non-exclusive, royalty-free license to use, store, and process such content solely to provide and improve the Service.
                            </p>
                        </section>

                        {/* Section 8 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">8. Disclaimers and Limitation of Liability</h2>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">8.1 Service Availability</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or completely secure. Scheduled maintenance and unforeseen outages may occur.
                            </p>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">8.2 Limitation of Liability</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ARCADEX SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST DATA, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                            </p>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                Our total liability to you for all claims arising from or related to the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
                            </p>
                        </section>

                        {/* Section 9 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">9. Termination and Suspension</h2>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">9.1 Termination by You</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                You may terminate your account at any time by contacting our support team. Upon termination, you will lose access to the Service at the end of your current billing period.
                            </p>

                            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">9.2 Termination by Us</h3>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                We reserve the right to suspend or terminate your account immediately, without prior notice, if:
                            </p>
                            <ul className="list-disc list-inside text-[12px] text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                                <li>You violate these Terms or our Privacy Policy</li>
                                <li>Your payment method fails or your account becomes delinquent</li>
                                <li>We reasonably believe your account poses a security risk</li>
                                <li>We discontinue the Service (with 90 days' notice)</li>
                            </ul>
                        </section>

                        {/* Section 10 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">10. Governing Law and Dispute Resolution</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                These Terms shall be governed by and construed in accordance with the laws of the State of [Your State], United States, without regard to its conflict of law provisions.
                            </p>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                Any disputes arising from or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the American Arbitration Association's Commercial Arbitration Rules, except that either party may seek injunctive relief in court to protect intellectual property rights.
                            </p>
                        </section>

                        {/* Section 11 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">11. Modifications to Terms</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                We reserve the right to modify these Terms at any time. We will provide notice of material changes by email or through the Service at least 30 days before the effective date. Your continued use of the Service after the effective date constitutes acceptance of the modified Terms.
                            </p>
                        </section>

                        {/* Section 12 */}
                        <section>
                            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4">12. Contact Information</h2>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                If you have questions about these Terms, please contact us at:
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6 space-y-2">
                                <p className="text-slate-700 dark:text-slate-300"><strong>Email:</strong> legal@charviam.com</p>
                                <p className="text-slate-700 dark:text-slate-300"><strong>General Inquiries:</strong> contact@charviam.com</p>
                                <p className="text-slate-700 dark:text-slate-300"><strong>Address:</strong> Charviam Inc., TX, USA</p>
                            </div>
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
