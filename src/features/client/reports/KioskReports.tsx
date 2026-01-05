import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Select } from '../../../shared/components/ui';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { adminApi } from '../../../shared/utils/api-service';
import { useAuth } from '../../../contexts/AuthContext';
import type { ReportFilters, Shop, PlaysReportResponse, KioskReportFieldConfig } from '../../../shared/types';
import { DEFAULT_KIOSK_REPORT_CONFIG } from '../../../shared/types';
import html2pdf from 'html2pdf.js';

export const KioskReports: React.FC = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [plays, setPlays] = useState<PlaysReportResponse | null>(null);
  const [sortKey, setSortKey] = useState<'amount' | 'timestamp' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    date_from?: string;
    date_to?: string;
    shop_id?: string;
    play_type?: string;
  }>({});
  // Export functionality (kept for future use)
  // const [exporting, setExporting] = useState(false);
  // const [exportFormat, setExportFormat] = useState<ReportFormat | null>(null);

  const [filters, setFilters] = useState<ReportFilters>({
    date_from: '',
    date_to: '',
    shop_id: '',
    play_type: 'BOTH',
  });

  // Report field config - loaded from selected shop
  const [fieldConfig, setFieldConfig] = useState<KioskReportFieldConfig>(DEFAULT_KIOSK_REPORT_CONFIG);

  // Load field config when shop changes
  useEffect(() => {
    const selectedShop = shops.find(s => s.id === filters.shop_id);
    if (selectedShop?.report_settings?.kiosk) {
      setFieldConfig({ ...DEFAULT_KIOSK_REPORT_CONFIG, ...selectedShop.report_settings.kiosk });
    } else {
      setFieldConfig(DEFAULT_KIOSK_REPORT_CONFIG);
    }
  }, [filters.shop_id, shops]);

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    const isEmployee = user?.role === 'EMPLOYEE';
    const params = new URLSearchParams(window.location.search);
    const date_from = params.get('date_from') || '';
    const date_to = params.get('date_to') || '';
    const play_type = (params.get('play_type') as ReportFilters['play_type']) || 'BOTH';

    // For employees, get shop_id from sessionStorage instead of URL params
    let shop_id = params.get('shop_id') || '';
    if (isEmployee) {
      const storedShop = sessionStorage.getItem('employee_selected_shop');
      if (storedShop) {
        try {
          const selectedShop = JSON.parse(storedShop);
          shop_id = selectedShop.id;
        } catch (e) {
          // Silently fail - shop selection from sessionStorage is optional
          console.log('Could not parse employee shop from storage:', e);
        }
      }
    }

    setFilters({ date_from, date_to, shop_id, play_type });
  }, [user]);

  const loadShops = async () => {
    try {
      const isEmployee = user?.role === 'EMPLOYEE';

      if (isEmployee) {
        // Employee: get selected shop from sessionStorage (set during login shop selection)
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
          // Auto-select the employee's shop
          setFilters(prev => ({ ...prev, shop_id: selectedShop.id }));
        }
      } else {
        // Admin: load shops from API
        const data = await adminApi.getShops();
        setShops(Array.isArray(data) ? data : ((data as any)?.results || []));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shops');
      setShops([]);
    }
  };

  const handleRunReport = async () => {
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Field-level validation
    const errors: typeof fieldErrors = {};
    if (!filters.date_from) errors.date_from = 'Required';
    if (!filters.date_to) errors.date_to = 'Required';
    if (!filters.shop_id) errors.shop_id = 'Required';
    if (!filters.play_type) errors.play_type = 'Required';

    const todayStr = new Date().toLocaleDateString('en-CA');
    if (filters.date_from && filters.date_from > todayStr) {
      errors.date_from = 'Cannot be in the future';
    }
    if (filters.date_from && filters.date_to && filters.date_from > filters.date_to) {
      errors.date_to = 'Must be after From date';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      // Refresh shop details to ensure we have the latest report settings
      if (filters.shop_id) {
        const freshShop = await adminApi.getShop(filters.shop_id);
        setShops(prevShops => {
          const index = prevShops.findIndex(s => s.id === freshShop.id);
          if (index >= 0) {
            const newShops = [...prevShops];
            newShops[index] = freshShop;
            return newShops;
          }
          return [...prevShops, freshShop];
        });
      }

      const data = await adminApi.getPlaysReport(filters);
      setPlays(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Export functionality (kept for future use)
  // const handleExport = async (format: ReportFormat) => {
  //   setExporting(true);
  //   setExportFormat(format);
  //   setError(null);
  //   try {
  //     const job = await adminApi.exportReport(format, filters);
  //     if (job.status === 'PENDING' || job.status === 'RUNNING') {
  //       await pollReportJob(job.id);
  //     } else if (job.file_url) {
  //       window.open(job.file_url, '_blank');
  //     }
  //   } catch (err: any) {
  //     setError(err.message || 'Failed to export report');
  //   } finally {
  //     setExporting(false);
  //     setExportFormat(null);
  //   }
  // };

  // const pollReportJob = async (jobId: string) => {
  //   const maxAttempts = 30;
  //   const pollInterval = 2000;
  //   for (let i = 0; i < maxAttempts; i++) {
  //     await new Promise((resolve) => setTimeout(resolve, pollInterval));
  //     const job = await adminApi.getReportJob(jobId);
  //     if (job.status === 'DONE' && job.file_url) {
  //       window.open(job.file_url, '_blank');
  //       return;
  //     } else if (job.status === 'FAILED') {
  //       throw new Error(job.error || 'Report generation failed');
  //     }
  //   }
  //   throw new Error('Report generation timeout. Please try again.');
  // };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const formatTimestamp = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const datePart = d.toLocaleDateString('en-US');
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
  };

  const sortedEntries = (() => {
    const entries = plays?.entries ?? [];
    if (!entries.length || !sortKey) return entries;
    const copy = [...entries];
    copy.sort((a, b) => {
      if (sortKey === 'timestamp') {
        return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * (sortDir === 'asc' ? 1 : -1);
      }
      const av = (filters.play_type === 'SPIN') ? a.spin_amount : (filters.play_type === 'MATCH') ? a.match_amount : a.total_amount;
      const bv = (filters.play_type === 'SPIN') ? b.spin_amount : (filters.play_type === 'MATCH') ? b.match_amount : b.total_amount;
      return (av - bv) * (sortDir === 'asc' ? 1 : -1);
    });
    return copy;
  })();

  const toggleSort = (key: 'amount' | 'timestamp') => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('desc');
    } else {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    }
  };

  // Helper function to generate print/CSV HTML based on fieldConfig
  const generatePrintHtml = () => {
    if (!plays) return '';
    const shopName = shops.find((s) => s.id === filters.shop_id)?.name || 'SHOP NAME';
    const rows = plays.entries ?? [];
    const totalEntries = rows.length;
    const generatedDate = new Date().toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
    const reportPeriod = `${filters.date_from} to ${filters.date_to}`;

    // Calculate totals for status breakdown
    const redeemedCount = plays.summary.redeemed_count || 0;
    const redeemedAmount = plays.summary.redeemed_amount || 0;
    const unredeemedCount = plays.summary.unredeemed_count || 0;
    const unredeemedAmount = plays.summary.unredeemed_amount || 0;
    const expiredCount = plays.summary.expired_count || 0;
    const expiredAmount = plays.summary.expired_amount || 0;
    const cancelledCount = plays.summary.cancelled_count || 0;
    const cancelledAmount = plays.summary.cancelled_amount || 0;
    let totalStatusCount = 0;
    let totalStatusAmount = 0;
    if (fieldConfig.showRedeemed ?? true) { totalStatusCount += redeemedCount; totalStatusAmount += redeemedAmount; }
    if (fieldConfig.showUnredeemed ?? true) { totalStatusCount += unredeemedCount; totalStatusAmount += unredeemedAmount; }
    if (fieldConfig.showExpired ?? true) { totalStatusCount += expiredCount; totalStatusAmount += expiredAmount; }
    if (fieldConfig.showCancelled ?? true) { totalStatusCount += cancelledCount; totalStatusAmount += cancelledAmount; }

    // Build summary section if enabled
    let summaryHtml = '';
    if (fieldConfig.showSummary) {
      summaryHtml = `
        <h3 style="font-size:14px;font-weight:bold;margin:24px 0 12px;font-family:Georgia,serif;text-transform:uppercase;">Summary</h3>
        <table style="width:100%;border-collapse:collapse;font-family:Georgia,serif;">
          <tr>
            <th style="padding:10px;border:1px solid #000;text-align:center;font-weight:bold;background:#f0f0f0;">Total Plays</th>
            <th style="padding:10px;border:1px solid #000;text-align:center;font-weight:bold;background:#f0f0f0;">Total Amount</th>
            <th style="padding:10px;border:1px solid #000;text-align:center;font-weight:bold;background:#f0f0f0;">Customers</th>
          </tr>
          <tr>
            <td style="padding:10px;border:1px solid #000;text-align:center;">${totalEntries}<br/><span style="font-size:11px;color:#555;">(${plays.summary.spins_count} Spin, ${plays.summary.matches_count} Match)</span></td>
            <td style="padding:10px;border:1px solid #000;text-align:center;">$${plays.summary.total_amount.toLocaleString()}<br/><span style="font-size:11px;color:#555;">(Spin: $${plays.summary.total_spin_amount}, Match: $${plays.summary.total_match_amount})</span></td>
            <td style="padding:10px;border:1px solid #000;text-align:center;">${plays.rows?.length || 0}</td>
          </tr>
        </table>
      `;
    }

    // Build status breakdown if enabled
    let statusHtml = '';
    if (fieldConfig.showStatusBreakdown) {
      const statusRows: string[] = [];
      if (fieldConfig.showRedeemed ?? true) statusRows.push(`<tr><td style="padding:8px 16px;border:1px solid #000;text-align:center;">Redeemed</td><td style="padding:8px 16px;border:1px solid #000;text-align:center;">${redeemedCount}</td><td style="padding:8px 16px;border:1px solid #000;text-align:center;">$${redeemedAmount.toFixed(2)}</td></tr>`);
      if (fieldConfig.showUnredeemed ?? true) statusRows.push(`<tr><td style="padding:8px 16px;border:1px solid #000;text-align:center;">Pending</td><td style="padding:8px 16px;border:1px solid #000;text-align:center;">${unredeemedCount}</td><td style="padding:8px 16px;border:1px solid #000;text-align:center;">$${unredeemedAmount.toFixed(2)}</td></tr>`);
      if (fieldConfig.showExpired ?? true) statusRows.push(`<tr><td style="padding:8px 16px;border:1px solid #000;text-align:center;">Expired</td><td style="padding:8px 16px;border:1px solid #000;text-align:center;">${expiredCount}</td><td style="padding:8px 16px;border:1px solid #000;text-align:center;">$${expiredAmount.toFixed(2)}</td></tr>`);
      if (fieldConfig.showCancelled ?? true) statusRows.push(`<tr><td style="padding:8px 16px;border:1px solid #000;text-align:center;">Cancelled</td><td style="padding:8px 16px;border:1px solid #000;text-align:center;">${cancelledCount}</td><td style="padding:8px 16px;border:1px solid #000;text-align:center;">$${cancelledAmount.toFixed(2)}</td></tr>`);

      if (statusRows.length > 0) {
        statusHtml = `
          <h3 style="font-size:14px;font-weight:bold;margin:24px 0 12px;font-family:Georgia,serif;text-transform:uppercase;">Status Breakdown</h3>
          <table style="width:100%;border-collapse:collapse;font-family:Georgia,serif;">
            <tr>
              <th style="padding:8px 16px;border:1px solid #000;text-align:center;font-weight:bold;background:#f0f0f0;">Status</th>
              <th style="padding:8px 16px;border:1px solid #000;text-align:center;font-weight:bold;background:#f0f0f0;">Count</th>
              <th style="padding:8px 16px;border:1px solid #000;text-align:center;font-weight:bold;background:#f0f0f0;">Amount</th>
            </tr>
            ${statusRows.join('')}
            <tr style="font-weight:bold;">
              <td style="padding:8px 16px;border:1px solid #000;text-align:center;font-weight:bold;">TOTAL</td>
              <td style="padding:8px 16px;border:1px solid #000;text-align:center;font-weight:bold;">${totalStatusCount}</td>
              <td style="padding:8px 16px;border:1px solid #000;text-align:center;font-weight:bold;">$${totalStatusAmount.toFixed(2)}</td>
            </tr>
          </table>
        `;
      }
    }

    // Build transaction details table if enabled
    let tableHtml = '';
    if (fieldConfig.showTransactionDetails ?? true) {
      // Build dynamic headers based on fieldConfig
      const headers: string[] = [];
      if (fieldConfig.showRowNumber ?? true) headers.push('#');
      if (fieldConfig.showCustomer) headers.push('Customer');
      if (fieldConfig.showPhone) headers.push('Phone');
      if (fieldConfig.showType) headers.push('Type');
      if (fieldConfig.showAmount) headers.push('Amount');
      if (fieldConfig.showStatus) headers.push('Status');
      if (fieldConfig.showDateTime) headers.push('Date/Time');

      // Build dynamic table rows with row numbers
      const tableRows = rows.map((r, idx) => {
        const cells: string[] = [];
        if (fieldConfig.showRowNumber ?? true) cells.push(`<td style="padding:8px;border:1px solid #000;text-align:center;">${idx + 1}</td>`);
        if (fieldConfig.showCustomer) cells.push(`<td style="padding:8px;border:1px solid #000;text-align:center;">${r.name_first} ${r.name_last}</td>`);
        if (fieldConfig.showPhone) cells.push(`<td style="padding:8px;border:1px solid #000;text-align:center;">${r.phone}</td>`);
        if (fieldConfig.showType) cells.push(`<td style="padding:8px;border:1px solid #000;text-align:center;">${r.play_type === 'SPIN' ? 'Spin' : 'Match'}</td>`);
        if (fieldConfig.showAmount) cells.push(`<td style="padding:8px;border:1px solid #000;text-align:center;">$${Number(r.total_amount).toFixed(2)}</td>`);
        if (fieldConfig.showStatus) cells.push(`<td style="padding:8px;border:1px solid #000;text-align:center;">${r.status || '-'}</td>`);
        if (fieldConfig.showDateTime) cells.push(`<td style="padding:8px;border:1px solid #000;text-align:center;">${formatTimestamp(r.timestamp)}</td>`);
        return `<tr>${cells.join('')}</tr>`;
      }).join('');

      if (headers.length > 0) {
        tableHtml = `
          <h3 style="font-size:14px;font-weight:bold;margin:24px 0 12px;font-family:Georgia,serif;text-transform:uppercase;">Transaction Details</h3>
          <table style="width:100%;border-collapse:collapse;font-family:Georgia,serif;font-size:12px;">
            <thead>
              <tr>${headers.map(h => `<th style="padding:8px;border:1px solid #000;text-align:center;font-weight:bold;background:#f0f0f0;">${h}</th>`).join('')}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        `;
      }
    }

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Kiosk Activity Report - ${shopName}</title>
          <style>
            @media print { 
              body { margin: 0.5in; } 
              @page { margin: 0.5in; size: letter; }
              .no-print { display: none; }
            }
            body { font-family: Georgia, "Times New Roman", serif; margin: 40px; color: #000; font-size: 12px; }
          </style>
        </head>
        <body>
          <div style="text-align:center;margin-bottom:20px;">
            <h1 style="font-size:22px;font-weight:bold;margin:0 0 4px;text-transform:uppercase;">${shopName}</h1>
            <h2 style="font-size:16px;font-weight:bold;margin:0 0 16px;">KIOSK ACTIVITY REPORT</h2>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:12px;">
            <div><strong>Report Period:</strong> ${reportPeriod}</div>
            <div><strong>Generated:</strong> ${generatedDate}</div>
          </div>
          <hr style="border:none;border-top:1px solid #000;margin:16px 0;" />
          ${summaryHtml}
          ${statusHtml}
          ${tableHtml}
          <hr style="border:none;border-top:1px solid #000;margin:24px 0 16px;" />
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:16px;">
            <div><strong>Entries:</strong> ${totalEntries}</div>
            <div>Page 1 of 1</div>
          </div>
          <p style="text-align:center;font-size:11px;font-style:italic;color:#333;">This report is confidential and intended for authorized personnel only.</p>
        </body>
      </html>
    `;
  };



  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const generateCsvContent = () => {
    if (!plays) return '';
    const rows = plays.entries ?? [];

    // Build headers
    const headers: string[] = [];
    if (fieldConfig.showRowNumber ?? true) headers.push('#');
    if (fieldConfig.showCustomer) headers.push('Customer');
    if (fieldConfig.showPhone) headers.push('Phone');
    if (fieldConfig.showType) headers.push('Type');
    if (fieldConfig.showAmount) headers.push('Amount');
    if (fieldConfig.showStatus) headers.push('Status');
    if (fieldConfig.showDateTime) headers.push('Date & Time');

    // Build rows
    const csvRows = rows.map((r, idx) => {
      const cells: string[] = [];
      if (fieldConfig.showRowNumber ?? true) cells.push(`${idx + 1}`);
      if (fieldConfig.showCustomer) cells.push(`"${r.name_first} ${r.name_last}"`);
      if (fieldConfig.showPhone) cells.push(`"${r.phone}"`);
      if (fieldConfig.showType) cells.push(`"${r.play_type}"`);
      if (fieldConfig.showAmount) cells.push(`${r.total_amount}`);
      if (fieldConfig.showStatus) cells.push(`"${r.status || '-'}"`);
      if (fieldConfig.showDateTime) cells.push(`"${formatTimestamp(r.timestamp)}"`);
      return cells.join(',');
    });

    return [headers.join(','), ...csvRows].join('\n');
  };

  const handleDownloadCsv = () => {
    const csvContent = generateCsvContent();
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `kiosk_report_${filters.shop_id || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadPdf = () => {
    const html = generatePrintHtml();
    if (!html) return;

    // Extract content and styles
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);

    if (!bodyMatch) return;

    const styles = styleMatch ? styleMatch[1] : '';
    const bodyContent = bodyMatch[1];

    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = `
      <style>${styles}</style>
      <div class="pdf-content">
        ${bodyContent}
      </div>
    `;

    // Adjust container for PDF generation
    container.style.width = '210mm';
    container.style.padding = '20px';
    container.style.background = 'white';

    const opt = {
      margin: 0.3,
      filename: `kiosk_report_${filters.shop_id || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(container).save();
  };

  const handlePrint = () => {
    const html = generatePrintHtml();
    if (!html) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => {
        win.focus();
        win.print();
      }, 500);
    }
  };

  return (
    <div>
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Filters */}

      <div className="space-y-6">
        {/* Filters Card */}
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                type="date"
                label="From"
                value={filters.date_from}
                onChange={(e) => {
                  handleFilterChange('date_from', e.target.value);
                  setFieldErrors(prev => ({ ...prev, date_from: undefined }));
                }}
                error={fieldErrors.date_from}
                required
                fullWidth
              />
              <Input
                type="date"
                label="To"
                value={filters.date_to}
                onChange={(e) => {
                  handleFilterChange('date_to', e.target.value);
                  setFieldErrors(prev => ({ ...prev, date_to: undefined }));
                }}
                max={new Date().toLocaleDateString('en-CA')}
                error={fieldErrors.date_to}
                required
                fullWidth
              />
              <Select
                label="Shop"
                value={filters.shop_id || ''}
                onChange={(e) => {
                  handleFilterChange('shop_id', e.target.value);
                  setFieldErrors(prev => ({ ...prev, shop_id: undefined }));
                }}
                options={[
                  { value: '', label: 'Select a shop...' },
                  ...(Array.isArray(shops) ? shops.map((shop) => ({ value: shop.id, label: shop.name })) : [])
                ]}
                error={fieldErrors.shop_id}
                required
                fullWidth
              />
              <Select
                label="Play Type"
                value={filters.play_type || 'BOTH'}
                onChange={(e) => {
                  handleFilterChange('play_type', e.target.value);
                  setFieldErrors(prev => ({ ...prev, play_type: undefined }));
                }}
                options={[
                  { value: 'BOTH', label: 'Both' },
                  { value: 'SPIN', label: 'Spin Only' },
                  { value: 'MATCH', label: 'Match Only' },
                ]}
                error={fieldErrors.play_type}
                required
                fullWidth
              />
            </div>
            <div className="flex justify-end mt-4 gap-3 items-center">
              {plays && (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print
                  </Button>

                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download
                      <svg className={`w-4 h-4 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </Button>

                    {showDownloadMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md shadow-lg z-50 py-1">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          onClick={() => {
                            handleDownloadCsv();
                            setShowDownloadMenu(false);
                          }}
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Download as CSV
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          onClick={() => {
                            handleDownloadPdf();
                            setShowDownloadMenu(false);
                          }}
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          Download as PDF
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Button
                onClick={handleRunReport}
                loading={loading}
                className="w-full min-[500px]:w-auto bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md"
              >
                Show Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plays Summary */}
        {plays && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-[500px]:gap-6 mb-6 overflow-hidden">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Plays</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {(plays.entries?.length || (plays.summary.spins_count + plays.summary.matches_count)).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Spins</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {plays.summary.spins_count.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Matches</p>
                    <p className="text-3xl font-bold text-slate-600 dark:text-slate-300 mt-2">
                      {plays.summary.matches_count.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Spin Amount</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      ${plays.summary.total_spin_amount.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Match Amount</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      ${plays.summary.total_match_amount.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      ${plays.summary.total_amount.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Breakdown - Show if configured with individual toggles */}
            {fieldConfig.showStatusBreakdown && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-[500px]:gap-6 mb-6 overflow-hidden">
                {(fieldConfig.showRedeemed ?? true) && (
                  <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Redeemed</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          {(plays.summary.redeemed_count || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          ${(plays.summary.redeemed_amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {(fieldConfig.showUnredeemed ?? true) && (
                  <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Unredeemed</p>
                        <p className="text-2xl font-bold text-yellow-600 mt-2">
                          {(plays.summary.unredeemed_count || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          ${(plays.summary.unredeemed_amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {(fieldConfig.showExpired ?? true) && (
                  <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired</p>
                        <p className="text-2xl font-bold text-gray-500 mt-2">
                          {(plays.summary.expired_count || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ${(plays.summary.expired_amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {(fieldConfig.showCancelled ?? true) && (
                  <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Cancelled</p>
                        <p className="text-2xl font-bold text-red-500 mt-2">
                          {(plays.summary.cancelled_count || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-red-500 mt-1">
                          ${(plays.summary.cancelled_amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Plays Table - Only show if Transaction Details is enabled */}
            {(fieldConfig.showTransactionDetails ?? true) && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between w-full gap-3">
                    <CardTitle className="text-base min-[500px]:text-lg">Play History</CardTitle>
                    <div className="flex items-center gap-2">
                      {/* Export buttons moved to filter bar */}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                      <thead>
                        <tr>
                          {fieldConfig.showCustomer && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>}
                          {fieldConfig.showPhone && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</th>}
                          {fieldConfig.showType && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>}
                          {fieldConfig.showAmount && <th onClick={() => toggleSort('amount')} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer">Amount {sortKey === 'amount' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>}
                          {fieldConfig.showStatus && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>}
                          {fieldConfig.showDateTime && <th onClick={() => toggleSort('timestamp')} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer">Date & Time {sortKey === 'timestamp' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {(sortedEntries.length > 0) ? sortedEntries.map((r) => (
                          <tr key={`${r.customer_id}-${r.timestamp}`}>
                            {fieldConfig.showCustomer && <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{r.name_first} {r.name_last}</td>}
                            {fieldConfig.showPhone && <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.phone}</td>}
                            {fieldConfig.showType && (
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${r.play_type === 'SPIN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                  {r.play_type}
                                </span>
                              </td>
                            )}
                            {fieldConfig.showAmount && <td className="px-4 py-3 text-sm text-green-700 font-medium">${r.total_amount}</td>}
                            {fieldConfig.showStatus && (
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${r.status === 'REDEEMED' ? 'bg-green-100 text-green-800' :
                                  r.status === 'ISSUED' ? 'bg-yellow-100 text-yellow-800' :
                                    r.status === 'EXPIRED' ? 'bg-gray-100 text-gray-600' :
                                      r.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-600'
                                  }`}>
                                  {r.status}
                                </span>
                              </td>
                            )}
                            {fieldConfig.showDateTime && <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatTimestamp(r.timestamp)}</td>}
                          </tr>
                        )) : plays.rows.map((r) => (
                          <tr key={r.customer_id}>
                            {fieldConfig.showCustomer && <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{r.name_first} {r.name_last}</td>}
                            {fieldConfig.showPhone && <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.phone}</td>}
                            {fieldConfig.showType && <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">-</td>}
                            {fieldConfig.showAmount && <td className="px-4 py-3 text-sm text-green-700 font-medium">${r.total_amount}</td>}
                            {fieldConfig.showStatus && <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">-</td>}
                            {fieldConfig.showDateTime && <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatTimestamp(r.last_play_at || undefined)}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!plays && !loading && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
              Select filters above and click "Show Report" to view your data.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

