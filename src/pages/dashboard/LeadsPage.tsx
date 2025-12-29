import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, LeadSource, LeadStatus, LEAD_STATUSES, SOURCE_COLORS, STATUS_COLORS } from '@/types/lead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import LeadDetailModal from '@/components/leads/LeadDetailModal';
import { Search, Filter, Users, RefreshCw, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Source configuration with colors
const SOURCE_CONFIGS = [
	{ id: 'all', label: 'All Sources', fullName: null as LeadSource | null, color: null },
	{ id: 'email', label: 'Email', fullName: 'Email Request' as LeadSource, color: '#f97316' },
	{ id: 'instagram', label: 'Instagram', fullName: 'Instagram Request' as LeadSource, color: '#e91e63' },
	{ id: 'ecomvestors', label: 'Ecomvestors', fullName: 'Ecomvestors Form' as LeadSource, color: '#3b82f6' },
	{ id: 'euroship', label: 'EuroShip', fullName: 'EuroShip Form' as LeadSource, color: '#10b981' },
];

// Columns to exclude from dynamic display (system columns)
const EXCLUDED_COLUMNS = ['id', 'source', 'status', 'notes', 'assignedAgent', 'meetingDate', 'meetingTime', 'meetingResult', 'postMeetingNotes'];

// Column display order priority (columns not in this list appear after)
const COLUMN_PRIORITY = ['Name', 'Full Name', 'Email', 'Phone', 'Company', 'Message', 'Budget', 'Country'];

type SortDirection = 'asc' | 'desc' | null;

export default function LeadsPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const { user } = useAuth();
	const { getActiveLeads, getLeadsBySource, isLoading, refetch, updateStatus, addNote, getStats } = useLeads();
	
	const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);

	const stats = getStats();
	const activeSource = searchParams.get('source') || 'all';

	// Handle tab change - update URL
	const handleTabChange = (value: string) => {
		if (value === 'all') {
			setSearchParams({});
		} else {
			setSearchParams({ source: value });
		}
	};

	const handleLeadClick = (lead: Lead) => {
		setSelectedLead(lead);
		setIsModalOpen(true);
	};

	const closeModal = useCallback(() => {
		setIsModalOpen(false);
		setTimeout(() => setSelectedLead(null), 100);
	}, []);

	const handleUpdateStatus = useCallback((leadId: string, status: LeadStatus) => {
		updateStatus(leadId, status);
	}, [updateStatus]);

	const handleAddNote = useCallback((leadId: string, note: string) => {
		addNote(leadId, note);
	}, [addNote]);

	// Get filtered leads based on source
	const getFilteredLeads = useCallback((): Lead[] => {
		let leads: Lead[];
		const currentConfig = SOURCE_CONFIGS.find(s => s.id === activeSource);
		
		if (currentConfig && currentConfig.fullName) {
			leads = getLeadsBySource(currentConfig.fullName).filter(l => l.status !== 'meeting booked');
		} else {
			leads = getActiveLeads();
		}

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			leads = leads.filter(lead => 
				Object.values(lead).some(value => 
					String(value).toLowerCase().includes(query)
				)
			);
		}

		// Apply status filter
		if (statusFilter !== 'all') {
			leads = leads.filter(lead => lead.status === statusFilter);
		}

		return leads;
	}, [activeSource, getActiveLeads, getLeadsBySource, searchQuery, statusFilter]);

	const filteredLeads = getFilteredLeads();

	// Dynamically extract all columns from leads
	const dynamicColumns = useMemo(() => {
		if (filteredLeads.length === 0) return [];

		// Collect all unique keys from all leads
		const allKeys = new Set<string>();
		filteredLeads.forEach(lead => {
			Object.keys(lead).forEach(key => {
				if (!EXCLUDED_COLUMNS.includes(key)) {
					allKeys.add(key);
				}
			});
		});

		// Convert to array and sort by priority
		const columns = Array.from(allKeys);
		
		return columns.sort((a, b) => {
			const priorityA = COLUMN_PRIORITY.indexOf(a);
			const priorityB = COLUMN_PRIORITY.indexOf(b);
			
			// Both have priority
			if (priorityA !== -1 && priorityB !== -1) {
				return priorityA - priorityB;
			}
			// Only A has priority
			if (priorityA !== -1) return -1;
			// Only B has priority
			if (priorityB !== -1) return 1;
			// Neither has priority - alphabetical
			return a.localeCompare(b);
		});
	}, [filteredLeads]);

	// Sort leads
	const sortedLeads = useMemo(() => {
		if (!sortColumn || !sortDirection) return filteredLeads;

		return [...filteredLeads].sort((a, b) => {
			const valA = a[sortColumn];
			const valB = b[sortColumn];

			// Handle null/undefined
			if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
			if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;

			// String comparison
			const strA = String(valA).toLowerCase();
			const strB = String(valB).toLowerCase();

			if (sortDirection === 'asc') {
				return strA.localeCompare(strB);
			} else {
				return strB.localeCompare(strA);
			}
		});
	}, [filteredLeads, sortColumn, sortDirection]);

	// Handle column sort
	const handleSort = (column: string) => {
		if (sortColumn === column) {
			// Cycle: asc -> desc -> null
			if (sortDirection === 'asc') {
				setSortDirection('desc');
			} else if (sortDirection === 'desc') {
				setSortColumn(null);
				setSortDirection(null);
			}
		} else {
			setSortColumn(column);
			setSortDirection('asc');
		}
	};

	// Get source count
	const getSourceCount = (fullName: LeadSource | null): number => {
		if (!fullName) return stats.total;
		return stats.bySource[fullName] || 0;
	};

	// Format cell value for display
	const formatCellValue = (value: unknown): string => {
		if (value === null || value === undefined || value === '') return '-';
		if (typeof value === 'boolean') return value ? 'Yes' : 'No';
		if (value instanceof Date) return value.toLocaleDateString();
		return String(value);
	};

	// Get sort icon
	const getSortIcon = (column: string) => {
		if (sortColumn !== column) {
			return <ArrowUpDown className="w-3 h-3 opacity-50" />;
		}
		if (sortDirection === 'asc') {
			return <ChevronUp className="w-3 h-3" />;
		}
		return <ChevronDown className="w-3 h-3" />;
	};

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Leads Management</h1>
					<p className="text-muted-foreground">
						{user?.role === 'ADMIN' ? 'View and manage all leads' : 'View and manage your assigned leads'}
					</p>
				</div>
				<Button onClick={() => refetch()} disabled={isLoading} variant="outline" className="border-border">
					<RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
					Refresh
				</Button>
			</div>

			{/* Source Tabs */}
			<Tabs value={activeSource} onValueChange={handleTabChange}>
				<TabsList className="bg-secondary border border-border">
					{SOURCE_CONFIGS.map(source => (
						<TabsTrigger 
							key={source.id} 
							value={source.id}
							className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
						>
							{source.color && (
								<span
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: source.color }}
								/>
							)}
							{source.label}
							<span className="text-xs opacity-70">
								({getSourceCount(source.fullName)})
							</span>
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{/* Filters */}
			<Card className="glass-card">
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
							<Input
								placeholder="Search all columns..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
							/>
						</div>
						<Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | 'all')}>
							<SelectTrigger className="w-full md:w-48 bg-secondary border-border text-foreground">
								<Filter className="w-4 h-4 mr-2" />
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent className="bg-popover border-border">
								<SelectItem value="all" className="text-foreground">All Statuses</SelectItem>
								{LEAD_STATUSES.filter(s => s !== 'meeting booked').map(status => (
									<SelectItem key={status} value={status} className="text-foreground capitalize">{status}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Leads Table */}
			<Card className="glass-card">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center justify-between text-foreground">
						<div className="flex items-center gap-2">
							<Users className="w-5 h-5 text-primary" />
							Leads ({sortedLeads.length})
						</div>
						<span className="text-xs text-muted-foreground font-normal">
							{dynamicColumns.length} columns detected
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{sortedLeads.length === 0 ? (
						<div className="text-center py-12 px-6">
							<Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
							<p className="text-muted-foreground">No leads found</p>
							<p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or refresh the data</p>
						</div>
					) : (
						<ScrollArea className="w-full">
							<div className="min-w-max">
								<table className="w-full">
									<thead>
										<tr className="border-b border-border bg-secondary/50">
											{/* Dynamic Columns */}
											{dynamicColumns.map(col => (
												<th 
													key={col} 
													className="text-left px-4 py-3 text-muted-foreground font-medium text-sm cursor-pointer hover:bg-secondary/80 transition-colors"
													onClick={() => handleSort(col)}
												>
													<div className="flex items-center gap-1">
														<span className="truncate max-w-[150px]" title={col}>{col}</span>
														{getSortIcon(col)}
													</div>
												</th>
											))}
											{/* Source Column */}
											<th className="text-left px-4 py-3 text-muted-foreground font-medium text-sm">Source</th>
											{/* Status Column */}
											<th className="text-left px-4 py-3 text-muted-foreground font-medium text-sm">Status</th>
											{/* Assigned Agent Column */}
											<th className="text-left px-4 py-3 text-muted-foreground font-medium text-sm">Assigned</th>
											{/* Action Column */}
											<th className="w-10"></th>
										</tr>
									</thead>
									<tbody>
										{sortedLeads.map((lead) => {
											const sourceColor = SOURCE_COLORS[lead.source];
											const statusColor = STATUS_COLORS[lead.status];
											
											return (
												<tr 
													key={lead.id}
													onClick={() => handleLeadClick(lead)}
													className="border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors group"
												>
													{/* Dynamic Columns */}
													{dynamicColumns.map(col => (
														<td key={col} className="px-4 py-3 text-foreground text-sm">
															<span className="truncate block max-w-[200px]" title={formatCellValue(lead[col])}>
																{formatCellValue(lead[col])}
															</span>
														</td>
													))}
													{/* Source */}
													<td className="px-4 py-3">
														<Badge className={`${sourceColor?.bg} ${sourceColor?.text} border-0 text-xs`}>
															{lead.source.replace(' Request', '').replace(' Form', '')}
														</Badge>
													</td>
													{/* Status */}
													<td className="px-4 py-3">
														<Badge className={cn(
															"text-xs",
															statusColor?.bg,
															statusColor?.text,
															statusColor?.border,
															"border"
														)}>
															{lead.status}
														</Badge>
													</td>
													{/* Assigned Agent */}
													<td className="px-4 py-3 text-sm text-muted-foreground">
														{lead.assignedAgent || '-'}
													</td>
													{/* Action */}
													<td className="px-4 py-3">
														<ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
							<ScrollBar orientation="horizontal" />
						</ScrollArea>
					)}
				</CardContent>
			</Card>

			{/* Lead Detail Modal */}
			<LeadDetailModal 
				lead={selectedLead}
				isOpen={isModalOpen}
				onClose={closeModal}
				onUpdateStatus={handleUpdateStatus}
				onAddNote={handleAddNote}
			/>
		</div>
	);
}
