import ClientService from "../services/clientService.js";

// Initialize service
const clientService = new ClientService();

/**
 * Controller: Create contracted client
 * Route: POST /api/clients
 * Access: Protected (all authenticated users)
 */
export const createClient = async (req, res, next) => {
  try {
    const clientData = req.body;
    const userId = req.user.id;

    const client = await clientService.createClient(clientData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all clients
 * Route: GET /api/clients
 * Access: Protected (all authenticated users)
 */
export const getAllClients = async (req, res, next) => {
  try {
    const clients = await clientService.getAllClients();

    res.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get client by ID
 * Route: GET /api/clients/:id
 * Access: Protected (all authenticated users)
 */
export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await clientService.getClientById(id);

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update client
 * Route: PATCH /api/clients/:id
 * Access: Protected (all authenticated users)
 */
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const client = await clientService.updateClient(id, updateData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Client updated successfully",
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete client
 * Route: DELETE /api/clients/:id
 * Access: Protected (admin, manager only)
 */
export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await clientService.deleteClient(id, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
