import User from "../models/User.js";

// Lấy danh sách users để donate
export async function getCreators(req, res) {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user?._id;

    let query = {};
    
    // Không hiển thị chính mình
    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }

    // Tìm kiếm theo tên hoặc username
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("username displayName avatarUrl bio")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await User.countDocuments(query);

    return res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getCreators error:", error);
    return res.status(500).json({ message: "Lỗi lấy danh sách", users: [] });
  }
}

// Lấy thông tin chi tiết 1 user (để donate)
export async function getCreatorByUsername(req, res) {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .select("username displayName avatarUrl bio dPointAvailable")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.json(user);
  } catch (error) {
    console.error("getCreatorByUsername error:", error);
    return res.status(500).json({ message: "Lỗi lấy thông tin" });
  }
}
