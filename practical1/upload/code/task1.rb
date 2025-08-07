require 'sqlite3'
require 'digest'
require 'bcrypt'

db = SQLite3::Database.new "users_realistic.db"
db.results_as_hash = true

begin
  db.execute("ALTER TABLE users ADD COLUMN md5_hash TEXT")
  db.execute("ALTER TABLE users ADD COLUMN sha256_hash TEXT")
  db.execute("ALTER TABLE users ADD COLUMN bcrypt_hash TEXT")
rescue SQLite3::Exception => e
  puts "Columns may already exist: #{e}"
end

users = db.execute("SELECT id, password FROM users")

users.each do |user|
  id = user['id']
  plain_psw = user['password']

  md5_psw = Digest::MD5.hexdigest(plain_psw)
  sha256_psw = Digest::SHA256.hexdigest(plain_psw)
  bcrypt_psw = BCrypt::Password.create(plain_psw, cost: BCrypt::Engine.cost)

  db.execute("UPDATE users SET md5_hash = ?, sha256_hash = ?, bcrypt_hash = ? WHERE id = ?",[md5_psw, sha256_psw, bcrypt_psw, id])
end

puts "Passwords hashed and stored successfully"