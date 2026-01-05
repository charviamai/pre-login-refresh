import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, Input, Switch, Badge, useConfirm, Pagination } from '../../../shared/components/ui';
import { Select } from '../../../shared/components/ui/Select';
import { Table } from '../../../shared/components/ui/Table';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { PhoneInput } from '../../../shared/components/PhoneInput';
import { adminApi } from '../../../shared/utils/api-service';
import { useShopOptional } from '../../../shared/context/ShopContext';
import { useAuth } from '../../../contexts/AuthContext';
import type { Shop } from '../../../shared/types';
import { EditButton, DeleteButton } from '../../../shared/components/ActionIcons';
import { validators } from '../../../shared/utils/validators';
import { DeletedCustomerConfirmModal } from './DeletedCustomerConfirmModal';

interface CustomerRecord {
    id: string;
    full_name: string;
    name_first: string;
    name_last: string;
    phone: string;
    email: string;
    date_of_birth: string;
    age: number;
    gender: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    shop: string;
    shop_name: string;
    status: string;
    is_active: boolean;
    has_biometric: boolean;
    ticket_balance: number;
    terms_accepted: boolean;
    marketing_consent: boolean;
    is_online_gamer: boolean;
    notes: string;
    last_visit_at: string | null;
    created_at: string;
    onboarded_by_name?: string;
    onboarded_via_device_name?: string;
    customer_type: string;
}

interface CustomerFormData {
    name_first: string;
    name_last: string;
    phone: string;
    country_code: string;
    email: string;
    birth_month: string;
    birth_year: string;
    birth_day: string;
    gender: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    shop_ids: string[];
    terms_accepted: boolean;
    marketing_consent: boolean;
    is_online_gamer: boolean;
    customer_type: string;
    notes: string;
}

const MONTHS = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const GENDERS = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];



// Generate valid birth years based on minimum age
// If month is provided, we can be more precise
const getValidYears = (minimumAge: number, selectedMonth?: string) => {
    const minYear = 1924; // Reasonable lower limit
    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth() + 1;

    // Calculate the cutoff year
    // If selectedMonth is provided and is after the current month, 
    // they need to be born one year earlier to be minimumAge years old
    let cutoffYear = thisYear - minimumAge;
    if (selectedMonth && parseInt(selectedMonth) > thisMonth) {
        cutoffYear -= 1;
    }

    const years = [];
    for (let year = cutoffYear; year >= minYear; year--) {
        years.push({ value: String(year), label: String(year) });
    }
    return years;
};

const DAYS = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: String(i + 1),
}));

const CUSTOMER_TYPES = [
    { value: 'REGULAR', label: 'Regular' },
    { value: 'SILVER', label: 'Silver' },
    { value: 'GOLD', label: 'Gold' },
];

const initialFormData: CustomerFormData = {
    name_first: '',
    name_last: '',
    phone: '',
    country_code: 'US',
    email: '',
    birth_month: '',
    birth_year: '',
    birth_day: '01',
    gender: 'PREFER_NOT_TO_SAY',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    shop_ids: [],
    terms_accepted: true,
    marketing_consent: false,
    is_online_gamer: false,
    customer_type: 'REGULAR',
    notes: '',
};

export const CustomersList: React.FC = () => {
    const { user } = useAuth();
    const shopContext = useShopOptional();
    const selectedShopId = shopContext?.selectedShopId || 'ALL';
    const isAllShopsSelected = shopContext?.isAllShopsSelected ?? true;
    const confirm = useConfirm();
    const [customers, setCustomers] = useState<CustomerRecord[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [duplicateCustomer, setDuplicateCustomer] = useState<CustomerRecord | null>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [showUnder21Modal, setShowUnder21Modal] = useState(false);
    const [under21Confirmed, setUnder21Confirmed] = useState(false);
    const [viewingCustomer, setViewingCustomer] = useState<CustomerRecord | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeletedCustomerModal, setShowDeletedCustomerModal] = useState(false);
    const [deletedCustomerData, setDeletedCustomerData] = useState<any>(null);
    const [restoringDeleted, setRestoringDeleted] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // Auto-scroll to top of modal when error occurs
    useEffect(() => {
        if (error && formRef.current && showModal) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [error, showModal]);

    // URL-based pagination state
    const [searchParams, setSearchParams] = useSearchParams();
    const initialPage = parseInt(searchParams.get('page') || '1', 10);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 25;

    const [formData, setFormData] = useState<CustomerFormData>(initialFormData);

    // Minimum age from shop settings (default to 18)
    const [minimumAge, setMinimumAge] = useState<number>(18);

    // Fetch shop settings when first shop is selected to get minimum_age
    useEffect(() => {
        const fetchShopMinimumAge = async () => {
            if (formData.shop_ids.length > 0) {
                try {
                    const shopSettings = await adminApi.getShopSettings(formData.shop_ids[0]);
                    if (shopSettings && typeof shopSettings.minimum_age === 'number') {
                        setMinimumAge(shopSettings.minimum_age);
                    } else {
                        setMinimumAge(18); // Default to 18 if not set
                    }
                } catch (err) {
                    // If settings not found, use default
                    setMinimumAge(18);
                }
            }
        };
        fetchShopMinimumAge();
    }, [formData.shop_ids]);

    // Function to calculate age from form data
    const calculateAge = (year: string, month: string, day: string): number => {
        if (!year || !month) return 0;
        const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day || '1'));
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Permission checks - CLIENT_ADMIN has full access, employees check permissions
    const isAdmin = user?.role === 'CLIENT_ADMIN';
    const permissions = user?.permissions as Record<string, boolean> | undefined;
    const canAdd = isAdmin || permissions?.can_add_customers;
    const canEdit = isAdmin || permissions?.can_edit_customers;
    const canDelete = isAdmin || permissions?.can_delete_customers;

    const loadData = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);

            // For employees, skip getShops() and use assigned_shops from user context
            // This avoids 403 error since ShopViewSet only allows CLIENT_ADMIN
            const isEmployee = user?.role === 'EMPLOYEE';

            // Get shop filter for global shop selection
            const shopIdFilter = isAllShopsSelected ? undefined : selectedShopId;

            if (isEmployee) {
                // Employee: only load customers (backend will filter by assigned shops)
                const customersData = await adminApi.getCustomers(shopIdFilter, page);
                const customerResponse = customersData as any;
                if (customerResponse?.results) {
                    setCustomers(customerResponse.results as CustomerRecord[]);
                    setTotalCount(customerResponse.count || 0);
                    setTotalPages(Math.ceil((customerResponse.count || 0) / PAGE_SIZE));
                } else {
                    const customersArray = Array.isArray(customersData) ? customersData : [];
                    setCustomers(customersArray as CustomerRecord[]);
                    setTotalCount(customersArray.length);
                    setTotalPages(1);
                }

                // Get selected shop from sessionStorage (set during login shop selection)
                const storedShop = sessionStorage.getItem('employee_selected_shop');
                if (storedShop) {
                    const selectedShop = JSON.parse(storedShop);
                    const employeeShops: Shop[] = [{
                        id: selectedShop.id,
                        name: selectedShop.name,
                        tenant_id: user?.tenant_id || '',
                        timezone: 'America/New_York',
                        is_active: true,
                        enable_employee_portal: true,
                        enable_kiosk_portal: true,
                        enable_online_onboarding: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }];
                    setShops(employeeShops);
                }
            } else {
                // Admin: load both customers and shops
                const [customersData, shopsData] = await Promise.all([
                    adminApi.getCustomers(shopIdFilter, page),
                    adminApi.getShops(),
                ]);
                const customerResponse = customersData as any;
                if (customerResponse?.results) {
                    setCustomers(customerResponse.results as CustomerRecord[]);
                    setTotalCount(customerResponse.count || 0);
                    setTotalPages(Math.ceil((customerResponse.count || 0) / PAGE_SIZE));
                } else {
                    const customersArray = Array.isArray(customersData) ? customersData : [];
                    setCustomers(customersArray as CustomerRecord[]);
                    setTotalCount(customersArray.length);
                    setTotalPages(1);
                }
                const shopsArray = Array.isArray(shopsData) ? shopsData : ((shopsData as { results?: Shop[] })?.results || []);
                setShops(shopsArray);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load customers');
            setCustomers([]);
            setShops([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Update URL with new page number
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (page === 1) {
                newParams.delete('page');
            } else {
                newParams.set('page', String(page));
            }
            return newParams;
        });
        loadData(page);
    };

    // Track the initial shop ID to detect actual shop changes vs initial load
    const initialShopIdRef = React.useRef<string | undefined>(selectedShopId);
    const hasLoadedRef = React.useRef(false);

    // Initial load - use page from URL
    useEffect(() => {
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadData(initialPage);
        }
    }, []);

    // Reload when global shop selection changes (only if it's a real change, not initial load)
    useEffect(() => {
        // Skip if this is the initial shop value being set
        if (initialShopIdRef.current === selectedShopId && !hasLoadedRef.current) {
            return;
        }
        // Skip if we haven't loaded yet
        if (!hasLoadedRef.current) {
            return;
        }
        // Only reset if the shop actually changed from what was initially set
        if (initialShopIdRef.current !== selectedShopId) {
            initialShopIdRef.current = selectedShopId; // Update the ref
            // Reset to page 1 when shop changes
            setCurrentPage(1);
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.delete('page');
                return newParams;
            });
            loadData(1);
        }
    }, [selectedShopId]);

    const filteredCustomers = customers.filter((customer) => {
        // Filter out deleted customers
        if (customer.status === 'DELETED') return false;

        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            customer.full_name.toLowerCase().includes(query) ||
            customer.phone.includes(query) ||
            (customer.email && customer.email.toLowerCase().includes(query))
        );
    });

    const handleOpenModal = (customer?: CustomerRecord) => {
        if (customer) {
            setEditingCustomer(customer);
            const [year, month, day] = customer.date_of_birth.split('-');
            setFormData({
                name_first: customer.name_first,
                name_last: customer.name_last || '',
                phone: customer.phone,
                country_code: 'US',
                email: customer.email || '',
                birth_month: month,
                birth_year: year,
                birth_day: day,
                gender: customer.gender,
                address_line1: customer.address_line1 || '',
                address_line2: customer.address_line2 || '',
                city: customer.city || '',
                state: customer.state || '',
                postal_code: customer.postal_code || '',
                shop_ids: [customer.shop],
                terms_accepted: customer.terms_accepted,
                marketing_consent: customer.marketing_consent,
                is_online_gamer: customer.is_online_gamer || false,
                customer_type: customer.customer_type || 'REGULAR',
                notes: customer.notes || '',
            });
        } else {
            setEditingCustomer(null);
            setFormData(initialFormData);
        }
        setUnder21Confirmed(false); // Reset under-21 confirmation flag
        setShowModal(true);
    };

    const checkDuplicate = async (phone: string): Promise<CustomerRecord | null> => {
        const existing = customers.find((c) => c.phone === phone);
        return existing || null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.shop_ids.length === 0) {
            setError('Customer must be assigned to at least one shop');
            return;
        }

        if (!formData.terms_accepted) {
            setError('Customer must accept terms and conditions');
            return;
        }

        // Validate phone number (10-11 digits) if provided
        if (formData.phone) {
            const phoneValidation = validators.phone(formData.phone);
            if (!phoneValidation.isValid) {
                setError(phoneValidation.error || 'Please enter a valid phone number');
                return;
            }
        }

        // Validate phone is required for online gamers
        if (formData.is_online_gamer && !formData.phone.trim()) {
            setError('Phone number is required for online gamers');
            return;
        }

        // Check for under 21 age and show confirmation modal (only when creating, not editing)
        if (!editingCustomer && !under21Confirmed) {
            const customerAge = calculateAge(formData.birth_year, formData.birth_month, formData.birth_day);
            if (customerAge < 21) {
                setShowUnder21Modal(true);
                return;
            }
        }

        // Check for duplicate when creating (only if phone is provided)
        if (!editingCustomer && formData.phone.trim()) {
            const duplicate = await checkDuplicate(formData.phone);
            if (duplicate) {
                setDuplicateCustomer(duplicate);
                setShowDuplicateModal(true);
                return;
            }
        }

        setSubmitting(true);

        try {
            const date_of_birth = `${formData.birth_year}-${formData.birth_month}-${formData.birth_day || '01'}`;

            const payload: Record<string, unknown> = {
                name_first: formData.name_first,
                name_last: formData.name_last,
                phone: formData.phone,
                email: formData.email,
                date_of_birth,
                gender: formData.gender,
                address_line1: formData.address_line1,
                address_line2: formData.address_line2,
                city: formData.city,
                state: formData.state,
                postal_code: formData.postal_code,
                shop: formData.shop_ids[0],
                shop_ids: formData.shop_ids,
                terms_accepted: formData.terms_accepted,
                marketing_consent: formData.marketing_consent,
                is_online_gamer: formData.is_online_gamer,
                customer_type: formData.customer_type,
                notes: formData.notes,
            };

            if (editingCustomer) {
                await adminApi.updateCustomer(editingCustomer.id, payload);
            } else {
                await adminApi.createCustomer(payload);
            }

            setShowModal(false);
            await loadData();
        } catch (err: any) {
            // Check if it's a deleted customer conflict (409)
            // Check both err.response.data and err.data in case of different error structures
            const errorData = err.response?.data || err.data || {};
            const status = err.status_code || err.response?.status || err.status;

            console.log('Create customer error:', { status, errorData, err });

            if (status === 409 && (err.deleted_customer_exists || errorData.deleted_customer_exists)) {
                setDeletedCustomerData(err.deleted_customer || errorData.deleted_customer);
                setShowDeletedCustomerModal(true);
                setSubmitting(false);
                return;
            }
            setError(err.message || errorData.message || 'Failed to save customer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (customerId: string) => {
        const confirmed = await confirm({
            title: 'Delete Customer',
            message: 'Are you sure you want to delete this customer?',
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (!confirmed) return;

        try {
            await adminApi.deleteCustomer(customerId);
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to delete customer');
        }
    };

    const handleRestoreDeletedCustomer = async () => {
        if (!deletedCustomerData) return;

        try {
            setRestoringDeleted(true);
            await adminApi.restoreCustomer(deletedCustomerData.id);
            setShowDeletedCustomerModal(false);
            setShowModal(false);
            setDeletedCustomerData(null);
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to restore customer');
        } finally {
            setRestoringDeleted(false);
        }
    };

    const handleCreateNewDespiteConflict = async () => {
        // For now, just inform user this isn't supported yet
        setShowDeletedCustomerModal(false);
        setError('Creating duplicate phone numbers is not supported. Please restore the existing customer or use a different phone number.');
    };

    const handleCancelDeletedModal = () => {
        setShowDeletedCustomerModal(false);
        setDeletedCustomerData(null);
    };

    const toggleShop = (shopId: string) => {
        setFormData((prev) => ({
            ...prev,
            shop_ids: prev.shop_ids.includes(shopId)
                ? prev.shop_ids.filter((id) => id !== shopId)
                : [...prev.shop_ids, shopId],
        }));
    };

    const columns = [
        {
            key: 'name',
            header: 'Name',
            render: (customer: CustomerRecord) => customer.full_name,
            isPrimaryOnMobile: true,
        },
        { key: 'phone', header: 'Phone', hideOnMobile: true },
        {
            key: 'age',
            header: 'Age',
            render: (customer: CustomerRecord) => `${customer.age} yrs`,
        },
        { key: 'shop_name', header: 'Shop' },
        {
            key: 'registered_by',
            header: 'Registered By',
            render: (customer: CustomerRecord) => {
                if (customer.onboarded_via_device_name) {
                    return <Badge variant="secondary">Kiosk</Badge>;
                } else if (customer.onboarded_by_name) {
                    return <Badge variant="primary">{customer.onboarded_by_name}</Badge>;
                }
                return <Badge variant="secondary">Unknown</Badge>;
            },
        },
        // Only show actions column if user can edit or delete
        ...((canEdit || canDelete) ? [{
            key: 'actions',
            header: 'Actions',
            render: (customer: CustomerRecord) => (
                <div className="flex space-x-1">
                    {canEdit && (
                        <EditButton onClick={() => handleOpenModal(customer)} tooltip="Edit Customer" />
                    )}
                    {canDelete && (
                        <DeleteButton onClick={() => handleDelete(customer.id)} tooltip="Delete Customer" />
                    )}
                </div>
            ),
        }] : []),
    ];

    if (loading) return <Loading message="Loading customers..." />;

    return (
        <PageContainer>
            <div className="mt-6">
                <PageHeader
                    title="Customer Management"
                    subtitle="Manage customer accounts and information"
                    actions={canAdd ? (
                        <Button
                            onClick={() => handleOpenModal()}
                            size="sm"
                            className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md text-xs min-[350px]:text-sm whitespace-nowrap px-3 min-[350px]:px-4"
                        >
                            Add Customer
                        </Button>
                    ) : undefined}
                />
            </div>

            {error && !showModal && <ErrorBanner message={error} onClose={() => setError(null)} />}

            {/* Search Bar */}
            <div className="mb-6">
                <Input
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block mt-2">
                <Table
                    columns={columns}
                    data={filteredCustomers}
                    keyExtractor={(customer) => customer.id}
                    emptyMessage="No customers found. Add your first customer to get started."
                />
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                    loading={loading}
                />
            </div>

            {/* Mobile Table - Simplified with Name and Actions */}
            <div className="md:hidden mt-2">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Name</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No customers found. Add your first customer to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => {
                                                    setViewingCustomer(customer);
                                                    setShowViewModal(true);
                                                }}
                                                className="text-left text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                                            >
                                                {customer.full_name}
                                            </button>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{customer.phone}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end space-x-1">
                                                {canEdit && (
                                                    <EditButton onClick={() => handleOpenModal(customer)} tooltip="Edit" />
                                                )}
                                                {canDelete && (
                                                    <DeleteButton onClick={() => handleDelete(customer.id)} tooltip="Delete" />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                    loading={loading}
                />
            </div>

            {/* View Customer Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Customer Details"
                size="lg"
            >
                {viewingCustomer && (
                    <div className="space-y-4">
                        {/* Header with actions */}
                        <div className="flex justify-end space-x-2 pb-3 border-b border-gray-200 dark:border-slate-700">
                            {canEdit && (
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        handleOpenModal(viewingCustomer);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        handleDelete(viewingCustomer.id);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            )}
                        </div>

                        {/* Customer Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{viewingCustomer.full_name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</p>
                                <p className="text-sm text-gray-900 dark:text-white">{viewingCustomer.phone || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</p>
                                <p className="text-sm text-gray-900 dark:text-white">{viewingCustomer.email || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Age</p>
                                <p className="text-sm text-gray-900 dark:text-white">{viewingCustomer.age} yrs</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Shop</p>
                                <p className="text-sm text-gray-900 dark:text-white">{viewingCustomer.shop_name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer Type</p>
                                <p className="text-sm text-gray-900 dark:text-white">{viewingCustomer.customer_type}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ticket Balance</p>
                                <p className="text-sm font-semibold text-green-600">${viewingCustomer.ticket_balance}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Registered By</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {viewingCustomer.onboarded_via_device_name ? 'Kiosk' : viewingCustomer.onboarded_by_name || 'Unknown'}
                                </p>
                            </div>
                        </div>

                        {viewingCustomer.notes && (
                            <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Notes</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{viewingCustomer.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Add/Edit Customer Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                size="xl"
            >
                <form id="customer-form" ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Alert inside the form */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                value={formData.name_first}
                                onChange={(e) => setFormData({ ...formData, name_first: e.target.value })}
                                required
                                fullWidth
                            />
                            <Input
                                label="Last Name (Optional)"
                                value={formData.name_last}
                                onChange={(e) => setFormData({ ...formData, name_last: e.target.value })}
                                fullWidth
                            />
                        </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Date of Birth</h3>
                        <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3 sm:gap-4">
                            <Select
                                label="Month"
                                value={formData.birth_month}
                                onChange={(e) => setFormData({ ...formData, birth_month: e.target.value })}
                                options={[{ value: '', label: 'Select Month' }, ...MONTHS]}
                                required
                                fullWidth
                            />
                            <Select
                                label="Year"
                                value={formData.birth_year}
                                onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
                                options={[{ value: '', label: 'Select Year' }, ...getValidYears(minimumAge, formData.birth_month)]}
                                required
                                fullWidth
                            />
                            <Select
                                label="Day (Optional)"
                                value={formData.birth_day}
                                onChange={(e) => setFormData({ ...formData, birth_day: e.target.value })}
                                options={[{ value: '01', label: '1 (Default)' }, ...DAYS.slice(1)]}
                                fullWidth
                            />
                        </div>
                    </div>

                    {/* Gender */}
                    <div>
                        <Select
                            label="Gender"
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            options={GENDERS}
                            fullWidth
                        />
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <PhoneInput
                                name="phone"
                                label={formData.is_online_gamer ? "Phone" : "Phone (Optional)"}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                countryCode={formData.country_code}
                                onCountryChange={(code) => setFormData({ ...formData, country_code: code })}
                                required={formData.is_online_gamer}
                                placeholder="0000000000"
                            />
                            <Input
                                label="Email (Optional)"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                fullWidth
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Address (Optional)</h3>
                        <div className="space-y-4">
                            <Input
                                label="Address Line 1"
                                value={formData.address_line1}
                                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                fullWidth
                            />
                            <Input
                                label="Address Line 2"
                                value={formData.address_line2}
                                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                                fullWidth
                            />
                            <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3 sm:gap-4">
                                <Input
                                    label="City"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    fullWidth
                                />
                                <Input
                                    label="State"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    fullWidth
                                />
                                <Input
                                    label="Postal Code"
                                    value={formData.postal_code}
                                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                    fullWidth
                                />
                            </div>
                        </div>
                    </div>

                    {/* Shop Assignments */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Shop Access <span className="text-red-500">*</span>
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Select at least one shop this customer can access
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-md p-3 bg-white dark:bg-slate-700">
                            {Array.isArray(shops) && shops.map((shop) => (
                                <label key={shop.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.shop_ids.includes(shop.id)}
                                        onChange={() => toggleShop(shop.id)}
                                        className="rounded text-slate-700 focus:ring-slate-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{shop.name}</span>
                                </label>
                            ))}
                        </div>
                        {formData.shop_ids.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
                                <p className="text-xs font-medium text-blue-900 dark:text-blue-400 mb-2">Shop Assigned:</p>
                                <div className="flex flex-wrap gap-2">
                                    {formData.shop_ids.map(shopId => {
                                        const shop = shops.find(s => s.id === shopId);
                                        return shop ? (
                                            <Badge key={shopId} variant="primary">
                                                {shop.name}
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                        {formData.shop_ids.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">At least one shop is required</p>
                        )}
                    </div>

                    {/* Options */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Options</h3>
                        <div className="space-y-3">
                            <Switch
                                checked={formData.is_online_gamer}
                                onChange={(checked) => setFormData({ ...formData, is_online_gamer: checked })}
                                label="Online Gamer"
                            />
                            {formData.is_online_gamer && !formData.phone && (
                                <p className="text-xs text-amber-600 mt-1 ml-1">Phone number is required for online gamers</p>
                            )}
                        </div>
                    </div>

                    {/* Customer Type */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Customer Type</h3>
                        <div className="flex flex-wrap gap-4">
                            {CUSTOMER_TYPES.map((type) => (
                                <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="customer_type"
                                        value={type.value}
                                        checked={formData.customer_type === type.value}
                                        onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                                        className="text-slate-700 focus:ring-slate-500"
                                    />
                                    <span className={`text-sm ${formData.customer_type === type.value ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {type.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Notes (Optional)</h3>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Internal notes about this customer..."
                        />
                    </div>

                    {/* Terms and Conditions */}
                    <div className="pt-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.terms_accepted}
                                onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                                className="mt-0.5 rounded text-slate-700 focus:ring-slate-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Customer is agreeing to the terms and conditions to play in this gaming room.
                            </span>
                        </label>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end space-x-3 pt-4 border-t dark:border-slate-700">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={submitting}>
                            {editingCustomer ? 'Update Customer' : 'Create Customer'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Duplicate Customer Modal */}
            <Modal
                isOpen={showDuplicateModal}
                onClose={() => setShowDuplicateModal(false)}
                title="Customer Already Exists"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        A customer with this phone number already exists:
                    </p>
                    {duplicateCustomer && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{duplicateCustomer.full_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{duplicateCustomer.phone}</p>
                        </div>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Please edit the existing customer instead of creating a new one.
                    </p>
                    <div className="flex justify-end space-x-3 pt-4 border-t dark:border-slate-700">
                        <Button variant="secondary" onClick={() => setShowDuplicateModal(false)}>
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                setShowDuplicateModal(false);
                                setShowModal(false);
                                if (duplicateCustomer) {
                                    handleOpenModal(duplicateCustomer);
                                }
                            }}
                        >
                            Edit Existing Customer
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Under 21 Age Warning Modal */}
            <Modal
                isOpen={showUnder21Modal}
                onClose={() => setShowUnder21Modal(false)}
                title="Age Verification Required"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
                        <svg className="h-8 w-8 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="font-semibold text-amber-800">Customer is under 21 years old</p>
                            <p className="text-sm text-amber-700 mt-1">
                                Age: <strong>{calculateAge(formData.birth_year, formData.birth_month, formData.birth_day)} years</strong>
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-600">
                        Are you sure you want to proceed with registering this customer?
                    </p>
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setShowUnder21Modal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setShowUnder21Modal(false);
                                setUnder21Confirmed(true);
                                // Trigger form submit again after confirmation
                                document.getElementById('customer-form')?.dispatchEvent(
                                    new Event('submit', { cancelable: true, bubbles: true })
                                );
                            }}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            Proceed Anyway
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Deleted Customer Conflict Modal */}
            {deletedCustomerData && (
                <DeletedCustomerConfirmModal
                    deletedCustomer={deletedCustomerData}
                    isOpen={showDeletedCustomerModal}
                    onRestore={handleRestoreDeletedCustomer}
                    onAddNew={handleCreateNewDespiteConflict}
                    onCancel={handleCancelDeletedModal}
                    restoring={restoringDeleted}
                />
            )}
        </PageContainer>
    );
};
