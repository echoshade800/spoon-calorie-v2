import mysql from 'mysql2/promise';

const dbConfig = {
  host: "vsa-db-dev.cb462qmg6ec1.us-east-1.rds.amazonaws.com",
  port: 3306,
  user: "miniapp1",
  password: "miniapp@20251",
  database: "calorie",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试连接
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('MySQL 数据库连接失败:', error);
    return false;
  }
};

// 执行查询
export const executeQuery = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('SQL 查询执行失败:', error);
    throw error;
  }
};

// 执行事务
export const executeTransaction = async (queries) => {
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