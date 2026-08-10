import { query, queryOne, execute } from "../mysql";

function findById(id: string) {
  return queryOne("SELECT * FROM user WHERE id = ?", [id]);
}

function findByUsername(username: string) {
  return queryOne("SELECT * FROM user WHERE username = ?", [username]);
}

function create(username: string, password: string, nickname: string) {
  return execute("INSERT INTO user (username, password, nickname) VALUES (?, ?, ?)", [
    username,
    password,
    nickname,
  ]);
}

function update(nickname: string, id: string) {
  return execute("UPDATE user SET nickname = ? WHERE id = ?", [nickname, id]);
}

function remove(id: string) {
  return execute("DELETE FROM user WHERE id = ?", [id]);
}

export default { findById, findByUsername, create, update, remove };
