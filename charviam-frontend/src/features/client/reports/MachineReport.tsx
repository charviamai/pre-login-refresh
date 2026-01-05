import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Select } from '../../../shared/components/ui';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { machinesApi, adminApi, MachineReportResponse } from '../../../shared/utils/api-service';
import { useAuth } from '../../../contexts/AuthContext';
import type { Shop } from '../../../shared/types';

export const MachineReport: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<MachineReportResponse | null>(null);
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    date_from?: string;
    date_to?: string;
  }>({});

  // Shops for filter
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  // Filter state
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to last 7 days
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Load shops on mount
  useEffect(() => {
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
            setSelectedShopId(selectedShop.id);
          }
        } else {
          // Admin: load shops from API
          const data = await adminApi.getShops() as Shop[] | { results: Shop[] };
          const shopsList = Array.isArray(data) ? data : (data?.results || []);
          setShops(shopsList);
          // If only one shop, auto-select it
          if (shopsList.length === 1) {
            setSelectedShopId(shopsList[0].id);
          }
        }
      } catch (err) {
        // Silently fail - shop list is not critical for report
        console.log('Could not load shops:', err);
      }
    };
    loadShops();
  }, [user]);

  const handleGetReport = async () => {
    // Clear previous errors
    setFieldErrors({});
    setError(null);

    // Field-level validation
    const errors: typeof fieldErrors = {};
    if (!fromDate) errors.date_from = 'Required';
    if (!toDate) errors.date_to = 'Required';

    if (fromDate && toDate && fromDate > toDate) {
      errors.date_to = 'Must be after From date';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Pass shopId if selected
      const data = await machinesApi.getMachineReport(fromDate, toDate, selectedShopId || undefined);

      if (data.error) {
        setError(data.message || data.error);
        setReportData(null);
      } else {
        setReportData(data);
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error || 'Failed to generate report';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportData) return;

    const win = window.open('', '_blank');
    if (!win) return;

    const machineRows = reportData.machines.map(machine => `
      <tr>
        <td>${machine.machine_name}</td>
        <td>${machine.machine_type}</td>
        <td>$${parseFloat(machine.total_in).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>$${parseFloat(machine.total_out).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="font-weight: bold; color: ${parseFloat(machine.net_profit) >= 0 ? '#059669' : '#DC2626'}">
          $${parseFloat(machine.net_profit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `).join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Machine Report - ${fromDate} to ${toDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            h1 { font-size: 24px; margin: 0 0 8px; }
            .date-range { font-size: 14px; color: #555; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border: 1px solid #ddd; padding: 10px; font-size: 13px; text-align: left; }
            th { background: #f7f7f7; text-transform: uppercase; letter-spacing: .02em; font-weight: 600; }
            tfoot td { font-weight: bold; background: #f9fafb; }
            .summary { margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .summary-row:last-child { border-bottom: none; }
            .summary-label { font-weight: 500; color: #374151; }
            .summary-value { font-weight: bold; }
            .profit-positive { color: #059669; }
            .profit-negative { color: #DC2626; }
          </style>
        </head>
        <body>
          <h1>Machine Report</h1>
          <div class="date-range">Period: ${new Date(fromDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to ${new Date(toDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          
          <table>
            <thead>
              <tr>
                <th>Machine</th>
                <th>Type</th>
                <th>Total IN</th>
                <th>Total OUT</th>
                <th>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              ${machineRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>TOTALS</strong></td>
                <td>$${parseFloat(reportData.summary.total_in).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>$${parseFloat(reportData.summary.total_out).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="${parseFloat(reportData.summary.net_profit) >= 0 ? 'profit-positive' : 'profit-negative'}">
                  $${parseFloat(reportData.summary.net_profit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
    win.print();
  };

  const handleDownloadCSV = () => {
    if (!reportData) return;

    const headers = ['Machine', 'Type', 'Total IN', 'Total OUT', 'Net Profit'];
    const rows = reportData.machines.map(m => [
      m.machine_name,
      m.machine_type,
      m.total_in,
      m.total_out,
      m.net_profit,
    ]);
    rows.push(['TOTALS', '', reportData.summary.total_in, reportData.summary.total_out, reportData.summary.net_profit]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `machine_report_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Machine Reading Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            View aggregated machine readings for a date range. Shows Total IN, Total OUT, and Net Profit for each machine.
          </p>
          <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {shops.length > 1 && (
              <Select
                label="Shop"
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                options={[
                  { value: '', label: 'All Shops' },
                  ...shops.map(shop => ({ value: shop.id, label: shop.name }))
                ]}
              />
            )}
            <Input
              type="date"
              label="From Date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setFieldErrors(prev => ({ ...prev, date_from: undefined }));
              }}
              error={fieldErrors.date_from}
              required
              fullWidth
            />
            <Input
              type="date"
              label="To Date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setFieldErrors(prev => ({ ...prev, date_to: undefined }));
              }}
              max={new Date().toISOString().split('T')[0]}
              error={fieldErrors.date_to}
              required
              fullWidth
            />
            <Button onClick={handleGetReport} loading={loading} className="w-full min-[500px]:w-auto">
              Get Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && <Loading message="Generating report..." />}

      {reportData && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total IN</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ${parseFloat(reportData.summary.total_in).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total OUT</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    ${parseFloat(reportData.summary.total_out).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit (IN - OUT)</p>
                  <p className={`text-3xl font-bold mt-2 ${parseFloat(reportData.summary.net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${parseFloat(reportData.summary.net_profit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between w-full gap-3">
                <CardTitle className="text-base min-[500px]:text-lg">
                  <span className="block min-[500px]:inline">Machine Details</span>
                  <span className="text-xs min-[500px]:text-sm font-normal text-gray-500 dark:text-gray-400 min-[500px]:ml-2 block min-[500px]:inline">
                    ({reportData.from_date} to {reportData.to_date})
                  </span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="flex-1 min-[500px]:flex-none text-xs min-[500px]:text-sm">
                    <svg className="w-4 h-4 mr-1 min-[500px]:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                    </svg>
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 min-[500px]:flex-none text-xs min-[500px]:text-sm">
                    <svg className="w-4 h-4 mr-1 min-[500px]:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18h12v-5H6v5z" />
                    </svg>
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.machines.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No machine data found for the selected date range.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Machine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total IN</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total OUT</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Profit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {reportData.machines.map((machine) => {
                        const netProfit = parseFloat(machine.net_profit);
                        return (
                          <tr key={machine.machine_id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                              {machine.machine_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {machine.machine_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                              ${parseFloat(machine.total_in).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                              ${parseFloat(machine.total_out).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-slate-700">
                      <tr>
                        <td colSpan={2} className="px-6 py-4 font-bold text-gray-900 dark:text-white">TOTALS</td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          ${parseFloat(reportData.summary.total_in).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-red-600">
                          ${parseFloat(reportData.summary.total_out).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${parseFloat(reportData.summary.net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${parseFloat(reportData.summary.net_profit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!reportData && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
            Select a date range above and click "Get Report" to view machine data.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

