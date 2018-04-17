<?php

/**
 * ImageCrop class
 * A method by which to carve up a URL sent by the eTextReader image capture tool
 * @param  string $URL image string generated using image capture in eTextReader
 */

namespace eTextReader\php;

class ImageCrop
{
    
    private $URL;

    public function __construct($URL)
    {

        $this->PID = $this->getPID($URL);
        $this->URL = $URL;
        $this->PageNum = $this->getPageNum();
        $this->Coordinates = $this->getCoordinates();
    }

    private function getPID($URL)
    {

        $url_parsed = parse_url($URL);
        preg_match('/(?<=\/fedora:).*(?=\|JP2\/)/', $url_parsed["path"], $matches);

        if (isset($matches[0])) {
            return $matches[0];
        } else {
            return null;
        }
    }

    private function getPageNum()
    {

        if (isset($this->PID)) {
            preg_match('/(?<=_Page_)[0-9]+/', $this->PID, $matches);
            if (isset($matches[0])) {
                return $matches[0];
            } else {
                return null;
            }
        }
    }

    private function getCoordinates()
    {
        if (isset($this->URL)) {
            preg_match('/(?<=\/)[0-9]+,*.*(?=\/full)/', $this->URL, $matches);
            if (isset($matches[0])) {
                return $matches[0];
            } else {
                return null;
            }
        }
    }

    public function insertIntoDB()
    {
        require "../config/config.php";

        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $pdo = new \PDO($dsn, $user, $pass);

        $sql = "INSERT INTO images (URL, PID, PageNum, Coordinates) VALUES (?,?,?,?)";
        $result = $pdo->prepare($sql)->execute([$this->URL, $this->PID, $this->PageNum, $this->Coordinates]);
        if ($result) {
            return true;
        } else {
            return false;
        }
    }
}

if (isset($_POST['ImageURL'])) {
    $image = new ImageCrop($_POST['ImageURL']);
    $image->insertIntoDB();
    echo json_encode($image);
} else {
    echo json_encode(false);
}
