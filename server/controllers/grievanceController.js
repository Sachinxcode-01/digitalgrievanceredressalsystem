const grievanceService = require('../services/grievanceService');

/**
 * Fetch grievances ordered by creation date.
 * Enforces security scoping: Users can only see their own tickets, Admins can see all.
 */
const getAllGrievances = async (req, res, next) => {
  try {
    const data = await grievanceService.getAllGrievances(req.user, req.query.user_id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Handle new grievance creation.
 */
const createGrievance = async (req, res, next) => {
  try {
    const newGrievance = await grievanceService.createGrievance(req.body, req.user, req.ip, req.headers['user-agent']);
    res.status(201).json(newGrievance);
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch a single grievance by ID.
 * Enforces owner-only and admin scoping.
 */
const getGrievanceById = async (req, res, next) => {
  try {
    const data = await grievanceService.getGrievanceById(req.params.id, req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Transition a grievance status.
 */
const updateGrievanceStatus = async (req, res, next) => {
  const { status, resolution_notes } = req.body;
  try {
    const updatedTicket = await grievanceService.updateGrievanceStatus(req.params.id, status, resolution_notes, req.user, req.ip, req.headers['user-agent']);
    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
};

/**
 * Assign a grievance ticket to an administrative officer or department.
 */
const assignGrievance = async (req, res, next) => {
  const { assigned_to, department } = req.body;
  try {
    const updatedTicket = await grievanceService.assignGrievance(req.params.id, assigned_to, department, req.user, req.ip, req.headers['user-agent']);
    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
};

/**
 * Escalate a grievance ticket.
 */
const escalateGrievance = async (req, res, next) => {
  const { reason } = req.body;
  try {
    const updatedTicket = await grievanceService.escalateGrievance(req.params.id, reason, req.user, req.ip, req.headers['user-agent']);
    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve timeline events for a ticket.
 */
const getGrievanceTimeline = async (req, res, next) => {
  try {
    const timeline = await grievanceService.getGrievanceTimeline(req.params.id, req.user);
    res.json(timeline);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllGrievances,
  createGrievance,
  getGrievanceById,
  updateGrievanceStatus,
  assignGrievance,
  escalateGrievance,
  getGrievanceTimeline
};
