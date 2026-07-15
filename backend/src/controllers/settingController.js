 import Setting from '../models/Setting.js';
export const getGlobalSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne({ key: 'global_config' });
    
    // Auto-initialize standard configuration row parameters if missing
    if (!settings) {
      settings = await Setting.create({ key: 'global_config' });
    }
    
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};
export const updateGlobalSettings = async (req, res, next) => {
  try {
    const settings = await Setting.findOneAndUpdate(
      { key: 'global_config' },
      { $set: req.body },
      { new: true, upsert: true }
    );
    
    res.json({ 
      success: true, 
      message: 'Global portal configurations persisted cleanly.', 
      data: settings 
    });
  } catch (error) {
    next(error);
  }
};