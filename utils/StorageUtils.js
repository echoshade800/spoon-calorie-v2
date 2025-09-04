import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 存储工具类
 * 提供AsyncStorage相关的操作方法
 */
export class StorageUtils {
  /**
   * 获取用户数据
   * @returns {Promise<Object|null>} 用户数据对象，如果不存在则返回null
   */
  static async getUserData() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('获取用户数据失败:', error);
      return null;
    }
  }

  /**
   * 保存用户数据
   * @param {Object} userData 用户数据对象
   * @returns {Promise<boolean>} 保存是否成功
   */
  static async setUserData(userData) {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('保存用户数据失败:', error);
      return false;
    }
  }

  /**
   * 清除用户数据
   * @returns {Promise<boolean>} 清除是否成功
   */
  static async clearUserData() {
    try {
      await AsyncStorage.removeItem('userData');
      return true;
    } catch (error) {
      console.error('清除用户数据失败:', error);
      return false;
    }
  }

  /**
   * 生成唯一用户ID
   * @returns {string} 唯一用户ID
   */
  static generateUID() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}