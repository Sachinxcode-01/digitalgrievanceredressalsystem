const supabase = require('../config/supabase');
const { sendGrievanceEmail, sendAdminNotification } = require('../services/emailService');

/**
 * Fetch all grievances ordered by creation date.
 */
const getAllGrievances = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false });
    
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
  const { ticket_id, user_id, email, title, description, category, urgency } = req.body;
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
