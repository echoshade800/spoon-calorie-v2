import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "calorie_tracker",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 30000,
  timeout: 30000,
  reconnect: true,
  connectTimeout: 20000
};

// 创建连接池
let pool;

try {
  pool = mysql.createPool(dbConfig);
} catch (error) {
  console.error('创建数据库连接池失败:', error);
  // 创建一个模拟的连接池用于开发环境
  pool = {
    getConnection: () => Promise.reject(new Error('数据库连接不可用')),
    query: () => Promise.reject(new Error('数据库连接不可用')),
    execute: () => Promise.reject(new Error('数据库连接不可用'))
  };
}

// 测试连接
export const testConnection = async () => {
  try {
    if (!pool || typeof pool.getConnection !== 'function') {
      console.warn('数据库连接池未初始化，使用模拟模式');
      return false;
    }
    const connection = await pool.getConnection();
    console.log('MySQL 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.warn('MySQL 数据库连接失败，应用将在模拟模式下运行:', error.message);
    return false;
  }
};

// 执行查询
export const executeQuery = async (sql, params = []) => {
  try {
    if (!pool || typeof pool.query !== 'function') {
      console.warn('数据库不可用，返回模拟数据');
      return [];
    }
    
    // 如果没有参数，使用 query 方法；如果有参数，使用 execute 方法
    if (params.length === 0) {
      const [rows] = await pool.query(sql);
      return rows;
    } else {
      const [rows] = await pool.execute(sql, params);
      return rows;
    }
  } catch (error) {
    console.warn('SQL 查询执行失败，返回空结果:', error.message);
    return [];
  }
};

// 执行事务
export const executeTransaction = async (queries) => {
  if (!pool || typeof pool.getConnection !== 'function') {
    console.warn('数据库不可用，事务操作失败');
    throw new Error('数据库连接不可用');
  }
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default pool;