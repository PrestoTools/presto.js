<?php
	$_POST = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);

	if (empty($_FILES)) {
		header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
		die();
	}
	foreach ($_FILES as $file) {
		if ($file['error'] !== 0) {
			header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
			die();
		}

		$file_id = $_POST['prestoId'];
		$file_name = $_POST['name'];
		$file_size = intval($_POST['size']);

		$save_dir = '../tmp';
		$save_part_dir = $save_dir.'/part';
		$save_file_path = $save_part_dir.'/'.$file_id.'.part'.$_POST['prestoChunkIndex'];
		if (!is_dir($save_dir)) {
			mkdir($save_dir, 0777, true);
		}
		if (is_dir($save_dir) && !is_dir($save_part_dir)) {
			mkdir($save_part_dir, 0777, true);
		}

		if (move_uploaded_file($file['tmp_name'], $save_file_path)) {
			$total_chunk_number = intval($_POST['totalChunkNumber']);
			$part_file_count = 0;
			foreach(scandir($save_part_dir) as $part_file) {
				if (stripos($part_file, $file_id) !== false) {
					$part_file_count++;
				}
			}
			if ($part_file_count < $total_chunk_number) {
				header($_SERVER['SERVER_PROTOCOL'] . ' 200 OK', true, 200);
				die();
			}

			createFileFromChunks($save_part_dir, $save_dir, $file_name, $file_id, $file_size);
			header($_SERVER['SERVER_PROTOCOL'] . ' 200 OK', true, 200);

			die();
		} else {
			header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
			die();
		}
	}

	function createFileFromChunks($save_part_dir, $save_dir, $file_name, $file_id, $file_size) {

		$total_files = 0;
		foreach(scandir($save_part_dir) as $file) {
			if (stripos($file, $file_id) !== false) {
				$total_files++;
			}
		}

		$delete_file_list = array();
		if (($fp = fopen($save_dir.'/'.$file_name, 'w')) !== false) {
			for ($i = 0; $i < $total_files; $i++) {
				$part_file = $save_part_dir.'/'.$file_id.'.part'.$i;
				fwrite($fp, file_get_contents($part_file));
				array_push($delete_file_list, $part_file);
			}
			fclose($fp);
		} else {
			header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
			die();
		}

		if (filesize($save_dir.'/'.$file_name) !== $file_size) {
			header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
			die();
		}

		foreach($delete_file_list as $delete_file) {
			if (file_exists($delete_file)) {
				@unlink($delete_file);
			}
		}

	}
