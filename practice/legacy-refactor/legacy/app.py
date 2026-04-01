"""
Legacy Python Application - 混乱的旧代码示例
不要在生产环境使用！
"""

import sqlite3
import json

# 全局变量
DATABASE = 'users.db'
API_KEY = 'secret_key_123'

def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DATABASE)
    return conn

def check_user(username, password):
    """验证用户（混乱的实现）"""
    # 硬编码密码
    if username == "admin" and password == "123456":
        return True
    
    # 重复的验证逻辑
    if len(username) < 3:
        return False
    if len(password) < 6:
        return False
    
    # 数据库查询（没有异常处理）
    conn = get_db()
    cursor = conn.cursor()
    # SQL 注入漏洞！
    cursor.execute("SELECT * FROM users WHERE username='" + username + "'")
    result = cursor.fetchone()
    if result:
        return True
    return False

def create_user(username, password, email):
    """创建用户（重复代码）"""
    # 重复的验证逻辑
    if len(username) < 3:
        return False
    if len(password) < 6:
        return False
    if '@' not in email:
        return False
    
    conn = get_db()
    cursor = conn.cursor()
    # SQL 注入漏洞！
    cursor.execute(
        "INSERT INTO users (username, password, email) VALUES('" +
        username + "', '" + password + "', '" + email + "')"
    )
    conn.commit()
    conn.close()
    return True

def get_user_data(user_id):
    """获取用户数据"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=" + str(user_id))
    result = cursor.fetchone()
    if result:
        return {
            'id': result[0],
            'username': result[1],
            'email': result[2]
        }
    return None

def update_user_data(user_id, username, email):
    """更新用户数据"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET username='" + username + "', email='" + email + 
        "' WHERE id=" + str(user_id)
    )
    conn.commit()
    conn.close()
    return True

def delete_user(user_id):
    """删除用户"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id=" + str(user_id))
    conn.commit()
    conn.close()
    return True

# 主程序
if __name__ == '__main__':
    print("Legacy App Running...")
    # 硬编码配置
    config = json.load(open('config.json'))
    print(f"API Key: {API_KEY}")
