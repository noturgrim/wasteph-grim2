import fileService from "../services/fileService.js";

export const getFiles = async (req, res, next) => {
  try {
    const options = {
      entityType: req.query.entityType,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await fileService.getFiles(
      options,
      req.user.id,
      req.user.role,
      req.user.isMasterSales
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getFileDownloadUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await fileService.getFileDownloadUrl(
      id,
      req.user.id,
      req.user.role,
      req.user.isMasterSales
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
