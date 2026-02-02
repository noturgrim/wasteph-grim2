import clientNotesService from "../services/clientNotesService.js";

/**
 * Controller: Create client note
 * Route: POST /api/client-notes
 * Access: Protected (sales, master_sales, admin)
 */
export const createClientNote = async (req, res, next) => {
  try {
    const noteData = req.body;
    const userId = req.user.id;

    const note = await clientNotesService.createNote(noteData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Client note created successfully",
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all client notes
 * Route: GET /api/client-notes
 * Access: Protected (sales, master_sales, admin)
 */
export const getAllClientNotes = async (req, res, next) => {
  try {
    const options = {
      clientId: req.query.clientId,
      interactionType: req.query.interactionType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const userId = req.user.id;
    const userRole = req.user.role;
    const isMasterSales = req.user.isMasterSales;

    const notes = await clientNotesService.getAllNotes(
      options,
      userId,
      userRole,
      isMasterSales
    );

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get client note by ID
 * Route: GET /api/client-notes/:id
 * Access: Protected (sales, master_sales, admin)
 */
export const getClientNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const isMasterSales = req.user.isMasterSales;

    const note = await clientNotesService.getNoteById(
      id,
      userId,
      userRole,
      isMasterSales
    );

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update client note
 * Route: PATCH /api/client-notes/:id
 * Access: Protected (sales, master_sales, admin)
 */
export const updateClientNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const isMasterSales = req.user.isMasterSales;

    const note = await clientNotesService.updateNote(
      id,
      updateData,
      userId,
      userRole,
      isMasterSales,
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    res.json({
      success: true,
      message: "Client note updated successfully",
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete client note
 * Route: DELETE /api/client-notes/:id
 * Access: Protected (sales, master_sales, admin)
 */
export const deleteClientNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const isMasterSales = req.user.isMasterSales;

    await clientNotesService.deleteNote(
      id,
      userId,
      userRole,
      isMasterSales,
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    res.json({
      success: true,
      message: "Client note deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get client timeline
 * Route: GET /api/clients/:clientId/timeline
 * Access: Protected (sales, master_sales, admin)
 */
export const getClientTimeline = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const isMasterSales = req.user.isMasterSales;

    const timeline = await clientNotesService.getClientTimeline(
      clientId,
      userId,
      userRole,
      isMasterSales
    );

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};
