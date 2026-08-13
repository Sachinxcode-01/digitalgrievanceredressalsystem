const express = require('express');
const router = express.Router();
const grievanceRepository = require('../repositories/grievanceRepository');

// @route   GET /api/v1/public/track/:ticketId
// @desc    Public unauthenticated ticket progress tracker lookup
router.get('/track/:ticketId', async (req, res, next) => {
  const { ticketId } = req.params;
  try {
    const rawTicket = await grievanceRepository.findByTicketId(ticketId) || await grievanceRepository.findById(ticketId);
    
    if (!rawTicket) {
      return res.status(404).json({
        error: `No grievance record found for ticket reference #${ticketId}`
      });
    }

    // Expose only safe public tracking parameters
    const safeData = {
      id: rawTicket.id,
      ticket_id: rawTicket.ticket_id,
      title: rawTicket.title,
      category: rawTicket.category || 'General',
      department: rawTicket.department || 'Facilities & Maintenance',
      urgency: rawTicket.urgency || 'Medium',
      status: rawTicket.status || 'Submitted',
      created_at: rawTicket.created_at,
      sla_due_at: rawTicket.sla_due_at,
      resolution_notes: rawTicket.resolution_notes || null,
      resolved_at: rawTicket.resolved_at || null
    };

    res.json(safeData);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
