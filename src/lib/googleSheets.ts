import { Lead, LeadSource, LeadStatus, LEAD_STATUSES } from '@/types/lead';

const SPREADSHEET_ID = '15iwQ1tp_lneoJPXGbSdd1gYQQZWOigpvseSEjQR2sdQ';

// Sheet names corresponding to each source
// ⚠️ Ces noms doivent correspondre EXACTEMENT aux noms des onglets Google Sheets
const SHEET_NAMES: Record<LeadSource, string> = {
  'Email Request': 'Email Request',
  'Instagram Request': 'Instagram Request',
  'Ecomvestors Form': 'Ecomvestors Form',
  'EuroShip Form': 'Europship Form'  // ✅ CORRIGÉ - nom exact de l'onglet Google Sheets
};

// Parse gviz JSON response
function parseGvizResponse(text: string): { cols: string[]; rows: unknown[][] } {
  // Remove the callback wrapper: google.visualization.Query.setResponse({...})
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/);
  if (!jsonMatch) {
    // Try parsing as regular JSON
    try {
      const data = JSON.parse(text);
      return parseGvizData(data);
    } catch {
      throw new Error('Failed to parse Google Sheets response');
    }
  }
  
  try {
    const data = JSON.parse(jsonMatch[1]);
    return parseGvizData(data);
  } catch (e) {
    throw new Error('Failed to parse gviz JSON');
  }
}

function parseGvizData(data: { table?: { cols?: { label?: string }[]; rows?: { c?: { v?: unknown }[] }[] } }): { cols: string[]; rows: unknown[][] } {
  const table = data.table;
  if (!table) {
    return { cols: [], rows: [] };
  }
  
  // Extract column names dynamically
  const cols = (table.cols || []).map((col, index) => col.label || `Column${index + 1}`);
  
  // Extract row data
  const rows = (table.rows || []).map(row => {
    return (row.c || []).map(cell => cell?.v ?? null);
  });
  
  return { cols, rows };
}

// Fetch data from a specific sheet
export async function fetchSheetData(source: LeadSource): Promise<Lead[]> {
  const sheetName = SHEET_NAMES[source];
  const encodedSheetName = encodeURIComponent(sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodedSheetName}&headers=1`;
  
  console.log(`[GoogleSheets] Fetching ${source} from sheet: "${sheetName}"`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    const { cols, rows } = parseGvizResponse(text);
    
    console.log(`[GoogleSheets] ${source} - Columns:`, cols);
    console.log(`[GoogleSheets] ${source} - Rows count:`, rows.length);
    
    // Convert rows to Lead objects
    const leads: Lead[] = rows.map((row, index) => {
      const lead: Lead = {
        id: `${source.replace(/\s+/g, '-').toLowerCase()}-${index + 1}`,
        source, // Source is set from the function parameter, NOT from sheet data
        status: 'new' as LeadStatus,
        notes: [],
      };
      
      // Map each column to the lead object dynamically
      cols.forEach((col, colIndex) => {
        const value = row[colIndex];
        const colLower = col.toLowerCase().trim();
        
        // Check if this is a status column
        if (colLower === 'status' || colLower === 'lead status') {
          const statusValue = String(value || 'new').toLowerCase().trim();
          if (LEAD_STATUSES.includes(statusValue as LeadStatus)) {
            lead.status = statusValue as LeadStatus;
          }
        } 
        // Check if this is an assigned agent column
        else if (colLower.includes('assigned') || colLower.includes('agent')) {
          lead.assignedAgent = value ? String(value) : undefined;
        }
        // Skip source column - we use the sheet tab name as source
        else if (colLower === 'source') {
          // Do nothing - source is already set from parameter
        }
        // Store all other columns dynamically
        else if (col && col.trim()) {
          lead[col] = value;
        }
      });
      
      return lead;
    }).filter(lead => {
      // Filter out empty rows - check if lead has any meaningful data
      const meaningfulKeys = Object.keys(lead).filter(key => 
        !['id', 'source', 'status', 'notes', 'assignedAgent'].includes(key)
      );
      
      return meaningfulKeys.some(key => {
        const value = lead[key];
        return value !== null && value !== undefined && value !== '';
      });
    });
    
    console.log(`[GoogleSheets] ${source} - Valid leads:`, leads.length);
    if (leads.length > 0) {
      console.log(`[GoogleSheets] ${source} - First lead sample:`, leads[0]);
    }
    
    return leads;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[GoogleSheets] Request timeout for ${source}`);
    } else {
      console.error(`[GoogleSheets] Error fetching ${source}:`, error);
    }
    return [];
  }
}

// Fetch all leads from all sources
export async function fetchAllLeads(): Promise<Record<LeadSource, Lead[]>> {
  const sources: LeadSource[] = [
    'Email Request',
    'Instagram Request',
    'Ecomvestors Form',
    'EuroShip Form'
  ];
  
  console.log('[GoogleSheets] Fetching all leads from all sources...');
  
  // Fetch each source INDEPENDENTLY with separate requests
  const leadsBySource: Record<LeadSource, Lead[]> = {
    'Email Request': [],
    'Instagram Request': [],
    'Ecomvestors Form': [],
    'EuroShip Form': []
  };
  
  // Use Promise.all but ensure each fetch is independent
  await Promise.all(
    sources.map(async (source) => {
      try {
        const leads = await fetchSheetData(source);
        leadsBySource[source] = leads;
        console.log(`[GoogleSheets] ✅ ${source}: ${leads.length} leads`);
      } catch (error) {
        console.error(`[GoogleSheets] ❌ ${source}: Error`, error);
        leadsBySource[source] = [];
      }
    })
  );
  
  console.log('[GoogleSheets] Final counts:', {
    'Email Request': leadsBySource['Email Request'].length,
    'Instagram Request': leadsBySource['Instagram Request'].length,
    'Ecomvestors Form': leadsBySource['Ecomvestors Form'].length,
    'EuroShip Form': leadsBySource['EuroShip Form'].length,
  });
  
  return leadsBySource;
}

// Get all leads as a flat array
export async function getAllLeadsFlat(): Promise<Lead[]> {
  const leadsBySource = await fetchAllLeads();
  return Object.values(leadsBySource).flat();
}
