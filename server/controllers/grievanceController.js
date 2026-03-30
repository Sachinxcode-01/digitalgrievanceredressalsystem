const supabase = require('../config/supabase');
const { sendGrievanceEmail, sendAdminNotification } = require('../services/emailService');

/**
 * Fetch all grievances ordered by creation date.
 * Supports optional ?user_id= query parameter for user-specific filtering.
 */
const getAllGrievances = async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = supabase
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Handle new grievance creation.
 */
const createGrievance = async (req, res) => {
  const { ticket_id, user_id, email, title, description, category, urgency, frustration_index } = req.body;
  try {
    const { data, error } = await supabase
      .from('grievances')
      .insert([
        { 
          ticket_id,
          user_id,
          title, 
          description, 
          category, 
          urgency,
          frustration_index: frustration_index || 1,
          status: 'Pending'
        }
      ])
      .select();
    
    if (error) throw error;

    // Send email notifications
    if (email) {
      sendGrievanceEmail(email, ticket_id, title).catch(console.error);
    }
    
    // Alert Admin
    sendAdminNotification(ticket_id, title, category, urgency).catch(console.error);
    
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllGrievances,
  createGrievance
};
