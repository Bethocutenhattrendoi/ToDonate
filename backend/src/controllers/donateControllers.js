import mongoose from "mongoose";
import Donate from "../models/Donate.js";

// Lấy tất cả donate
export const getAllDonates = async (req, res) => {
  try {
    const donates = await Donate.find().sort({ createdAt: -1 });
    res.status(200).json(donates);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu Donate:", error);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu Donate" });
  }
};

// Tạo donate mới
export const createDonate = async (req, res) => {
  try {
    const { title, amount, name, message, status } = req.body;

    // Validate dữ liệu cơ bản
    if (!name || !amount) {
      return res.status(400).json({ message: "Thiếu trường name hoặc amount" });
    }
    if (status && !["pending", "success", "failed"].includes(status)) {
      return res.status(400).json({ message: "Trường status không hợp lệ" });
    }

    const newDonate = new Donate({
      title: title || "",
      amount,
      name,
      message: message || "",
      status: status || "pending",
    });

    await newDonate.save();

    res.status(201).json({
      message: "Donate mới đã được tạo thành công",
      donate: newDonate,
    });
  } catch (error) {
    console.error("Lỗi khi tạo Donate mới:", error);
    res.status(500).json({ message: "Lỗi khi tạo Donate mới", error: error.message });
  }
};

// Cập nhật donate theo ID
export const updateDonate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // Validate dữ liệu update
    if (updateData.status && !["pending", "success", "failed"].includes(updateData.status)) {
      return res.status(400).json({ message: "Trường status không hợp lệ" });
    }

    const updatedDonate = await Donate.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedDonate) {
      return res.status(404).json({ message: "Không tìm thấy Donate" });
    }

    res.status(200).json({
      message: "Donate đã được cập nhật",
      donate: updatedDonate,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật Donate:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật Donate", error: error.message });
  }
};

// Xoá donate theo ID
export const deleteDonate = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const deletedDonate = await Donate.findByIdAndDelete(id);

    if (!deletedDonate) {
      return res.status(404).json({ message: "Không tìm thấy Donate" });
    }

    res.status(200).json({
      message: "Donate đã được xoá",
      donate: deletedDonate,
    });
  } catch (error) {
    console.error("Lỗi khi xoá Donate:", error);
    res.status(500).json({ message: "Lỗi khi xoá Donate", error: error.message });
  }
};
