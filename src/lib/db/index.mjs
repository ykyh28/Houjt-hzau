import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// 解决ESM中的__dirname问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保数据库目录存在
const DB_PATH = join(process.cwd(), 'data');
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

// 创建数据库连接
const db = new Database(join(process.cwd(), 'database.sqlite'));

// 启用外键约束
db.pragma('foreign_keys = ON');

// 初始化数据库
function initializeDatabase() {
  // 团队成员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      degree TEXT,
      research TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      google_scholar TEXT,
      research_gate TEXT,
      orcid TEXT,
      bio TEXT,
      photo_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      join_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 出版物表
  db.exec(`
    CREATE TABLE IF NOT EXISTS publications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      authors TEXT NOT NULL,
      journal TEXT NOT NULL,
      year INTEGER NOT NULL,
      volume TEXT,
      issue TEXT,
      pages TEXT,
      doi TEXT,
      abstract TEXT,
      pdf_url TEXT,
      is_highlighted INTEGER NOT NULL DEFAULT 0,
      citation_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 出版物关键词表
  db.exec(`
    CREATE TABLE IF NOT EXISTS publication_keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      publication_id INTEGER NOT NULL,
      keyword TEXT NOT NULL,
      FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE
    )
  `);

  // 出版物-作者关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS publication_authors (
      publication_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      PRIMARY KEY (publication_id, author_id),
      FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES team_members(id) ON DELETE CASCADE
    )
  `);

  // 项目表
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      funding_source TEXT,
      funding_amount REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 项目-成员关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      PRIMARY KEY (project_id, member_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE
    )
  `);

  // 新闻表
  db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      publish_date TEXT NOT NULL,
      author TEXT,
      image_url TEXT,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 待办事项表
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      priority TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 更新触发器 - 团队成员
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_team_members_timestamp
    AFTER UPDATE ON team_members
    BEGIN
      UPDATE team_members SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  // 更新触发器 - 出版物
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_publications_timestamp
    AFTER UPDATE ON publications
    BEGIN
      UPDATE publications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  // 更新触发器 - 项目
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_projects_timestamp
    AFTER UPDATE ON projects
    BEGIN
      UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  // 更新触发器 - 新闻
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_news_timestamp
    AFTER UPDATE ON news
    BEGIN
      UPDATE news SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  // 更新触发器 - 用户
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  // 更新触发器 - 待办事项
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_todos_timestamp
    AFTER UPDATE ON todos
    BEGIN
      UPDATE todos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
}

// 初始化数据库
initializeDatabase();

// 关闭数据库连接
process.on('exit', () => {
  db.close();
});

export default db; 