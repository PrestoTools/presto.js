class App
  def call(env)
    unless env['REQUEST_METHOD'] == 'POST'
      return [
        405,
        {'Content-Type' => 'text/plain', 'Access-Control-Allow-Origin' => '*'},
        ['Method Not Allowed']
      ]
    end

    begin
      req = Rack::Request.new(env)

      raise if req[:chunk].nil?

      file_id = req[:prestoId]
      file_name = req[:name]
      file_size = req[:size].to_i

      save_dir = '../tmp'
      save_part_dir = "#{save_dir}/part"
      save_file_path = "#{save_part_dir}/#{file_id}part#{req[:prestoChunkIndex]}"

      Dir.mkdir(save_dir) unless Dir.exist?(save_dir)
      Dir.mkdir(save_part_dir) unless Dir.exist?(save_part_dir)

      File.open(save_file_path, 'wb'){ |f|
        f.write(req[:chunk][:tempfile].read)
      }

      total_chunk_number = req[:totalChunkNumber].to_i
      part_file_count = 0;
      Dir.glob("#{save_part_dir}/#{file_id}*").each do |f|
        part_file_count += 1
      end

      if part_file_count == total_chunk_number
        createFileFromChunks(save_part_dir, save_dir, file_name, file_id, file_size)
      end

      [
        200,
        {'Content-Type' => 'text/plain', 'Access-Control-Allow-Origin' => '*'},
        ['Success']
      ]

    rescue
      [
        500,
        {'Content-Type' => 'text/plain', 'Access-Control-Allow-Origin' => '*'},
        ['Internal Server Error']
      ]
    end
  end

  def createFileFromChunks(save_part_dir, save_dir, file_name, file_id, file_size)
    total_chunk_files = 0
    Dir.glob("#{save_part_dir}/#{file_id}*").each do |f|
      total_chunk_files += 1
    end

    save_file = File.open("#{save_dir}/#{file_name}", 'w')
    save_file.flock(File::LOCK_EX)
    (0..(total_chunk_files - 1)).each do |chunk_index|
      save_file.write(
        File.open("#{save_part_dir}/#{file_id}part#{chunk_index}").read
      )
    end
    save_file.close

    raise unless File.size("#{save_dir}/#{file_name}") == file_size

    Dir.glob("#{save_part_dir}/#{file_id}*").each do |f|
      File.delete(f)
    end

  end
end
