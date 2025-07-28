require 'digest'
require 'sqlite3'

def manual_hash_cracker
  db = SQLite3::Database.open("utils/users_realistic.db")
  db.results_as_hash = true

  cracked_passwords = []
  total_start = Time.now

  db.execute("SELECT id, sha256_hash FROM users WHERE sha256_hash IS NOT NULL ") do |row|
    File.open("utils/rockyou.txt", "r:UTF-8", invalid: :replace, undef: :replace, replace: "") do |file|
      file.each_line do |word|
        word = word.scrub.strip rescue next
        next if word.empty?
        if Time.now - total_start > 3*60
          puts "Spent over 3 minutes looking"
          return
        end
        if Digest::SHA256.hexdigest(word) == row['sha256_hash']
          puts "Found"
          cracked_passwords << { user_id: row['id'], password: word }
          break
        end
      end
    end
  end
  db.close

  total_time = Time.now - total_start

  puts "Summary: Cracked #{cracked_passwords.size} passwords"
  cracked_passwords.each do |item|
    puts "#{item[:user_id]}: #{item[:password]}"
  end
  puts "Total time: #{total_time}"
end

manual_hash_cracker
