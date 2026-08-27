const { supabase } = require('../config/supabase');
const grievanceService = require('./grievanceService');

/**
 * Generate Executive Board Governance Digest metrics & HTML summary
 */
async function generateExecutiveBoardDigest() {
  const allGrievances = await grievanceService.getAllGrievances();
  const total = allGrievances.length;
  const resolved = allGrievances.filter(g => g.status === 'RESOLVED' || g.status === 'CLOSED').length;
  const open = total - resolved;
  const emergencyCount = allGrievances.filter(g => g.is_emergency || g.priority === 'CRITICAL').length;
  const slaBreached = allGrievances.filter(g => g.is_sla_breached || (new Date(g.sla_due_at) < new Date() && g.status !== 'RESOLVED')).length;
  const complianceRate = total > 0 ? (((total - slaBreached) / total) * 100).toFixed(1) : '100.0';

  // Department breakdown
  const deptStats = {};
  allGrievances.forEach(g => {
    const dept = g.department || 'Unassigned';
    if (!deptStats[dept]) {
      deptStats[dept] = { total: 0, resolved: 0, breached: 0 };
    }
    deptStats[dept].total += 1;
    if (g.status === 'RESOLVED' || g.status === 'CLOSED') deptStats[dept].resolved += 1;
    if (g.is_sla_breached) deptStats[dept].breached += 1;
  });

  const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const htmlDigest = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 20px; }
        .card { background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .title { color: #0f172a; font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .subtitle { color: #64748b; font-size: 13px; margin-bottom: 20px; }
        .grid { display: flex; gap: 16px; margin-bottom: 20px; }
        .stat-box { flex: 1; background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #cbd5e1; }
        .stat-val { font-size: 24px; font-weight: 700; color: #2563eb; }
        .stat-lbl { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        th { background: #f8fafc; color: #475569; font-weight: 600; }
        .badge-danger { color: #dc2626; font-weight: 600; }
        .badge-success { color: #16a34a; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="title">🏛️ ResolveNow — Executive Board Governance Digest</div>
        <div class="subtitle">Official Institutional Oversight & Governance Compliance Report | Generated: ${generatedAt} IST</div>
        
        <div class="grid">
          <div class="stat-box">
            <div class="stat-val">${total}</div>
            <div class="stat-lbl">Total Grievances</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color: #16a34a;">${resolved}</div>
            <div class="stat-lbl">Resolved Cases</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color: #dc2626;">${slaBreached}</div>
            <div class="stat-lbl">SLA Breaches</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color: #ea580c;">${emergencyCount}</div>
            <div class="stat-lbl">Emergency SOS</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color: #0284c7;">${complianceRate}%</div>
            <div class="stat-lbl">Compliance Score</div>
          </div>
        </div>

        <h3 style="margin-top: 24px; color: #334155;">Department Performance Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Total Filed</th>
              <th>Resolved</th>
              <th>SLA Breached</th>
              <th>Resolution Rate</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(deptStats).map(([dept, data]) => {
              const rate = data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(0) : '100';
              return `
                <tr>
                  <td><strong>${dept}</strong></td>
                  <td>${data.total}</td>
                  <td class="badge-success">${data.resolved}</td>
                  <td class="${data.breached > 0 ? 'badge-danger' : ''}">${data.breached}</td>
                  <td>${rate}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  return {
    metrics: {
      total,
      resolved,
      open,
      slaBreached,
      emergencyCount,
      complianceRate,
      deptStats,
      generatedAt
    },
    htmlDigest
  };
}

module.exports = {
  generateExecutiveBoardDigest
};
