require 'sqlite3'

db = SQLite3::Database.open("users_realistic.db")
db.results_as_hash = true

File.open("md5_hashes.txt", "w") do |file|
  db.execute("SELECT id, md5_hash FROM users WHERE md5_hash IS NOT NULL ") do |row|
    file.puts "#{row['md5_hash']}"
  end
end

File.open("sha256_hashes.txt", "w") do |file|
  db.execute("SELECT id, sha256_hash FROM users WHERE sha256_hash IS NOT NULL ") do |row|
    file.puts "#{row['sha256_hash']}"
  end
end

File.open("bcrypt_hashes.txt", "w") do |file|
  db.execute("SELECT id, bcrypt_hash FROM users WHERE bcrypt_hash IS NOT NULL ") do |row|
    file.puts "#{row['bcrypt_hash']}"
  end
end
puts "Exported hashes to external files."