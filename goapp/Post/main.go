package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/ipqwery/ipapi-go"
	"github.com/tursodatabase/go-libsql"
	"github.com/joho/godotenv"
)

// User represents a user in the system
type User struct {
	ID        int    `json:"id"`
	Username  string `json:"username" binding:"required"`
	Password  string `json:"password" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	BirthDate string `json:"birthDate" binding:"required"`
	FullName  string `json:"fullName" binding:"required"`
}

// Singleton pattern for database connection
var (
	db   *sql.DB
	once sync.Once
)

func goDotEnvVariable(key string) string {
	
	// load .env file
	err := godotenv.Load(".env")

	if err != nil {
		fmt.Println("Error loading .env file")
	}

	return os.Getenv(key)
}

// GetDB returns the singleton database connection
func GetDB() *sql.DB {
	once.Do(func() {
		dbName := goDotEnvVariable("DB_NAME")
		primaryUrl := goDotEnvVariable("PRIMARY_URL")
		authToken := goDotEnvVariable("AUTH_TOKEN")

		dir, err := os.MkdirTemp("", "libsql-*")
		if err != nil {
			fmt.Println("Error creating temporary directory:", err)
			os.Exit(1)
		}
		// Comment out RemoveAll to persist database files
		// defer os.RemoveAll(dir)

		dbPath := filepath.Join(dir, dbName)

		connector, err := libsql.NewEmbeddedReplicaConnector(dbPath, primaryUrl,
			libsql.WithAuthToken(authToken),
		)
		if err != nil {
			fmt.Println("Error creating connector:", err)
			os.Exit(1)
		}
		// defer connector.Close() // Removed to keep the connection open
		db = sql.OpenDB(connector)
		if err := db.Ping(); err != nil {
			fmt.Println("Error connecting to database:", err)
			os.Exit(1)
		}
		initializeDatabase(db)
	})
	return db
}


// Initialize the database by creating the users table if it doesn't exist
func initializeDatabase(db *sql.DB) {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		birthDate TEXT NOT NULL,
		fullName TEXT NOT NULL
	);`
	_, err := db.Exec(query)
	if err != nil {
		fmt.Println("Error creating users table:", err)
		os.Exit(1)
	}
}

// Handler for the GET API for /
func homeHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"statusCode": http.StatusOK,
		"message":    "Por Victor Manuel Rangel Mejia",
	})
}

// Handler for the GET API for /validate
func getHandler(c *gin.Context) {
	username := c.GetHeader("Username")
	password := c.GetHeader("Password")

	if username == "" || password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"statusCode": http.StatusBadRequest,
			"message":    "Username and Password headers are required",
		})
		return
	}

	db := GetDB()
	var user User
	err := db.QueryRow("SELECT id, username, password, email, birthDate, fullName FROM users WHERE username = ? AND password = ?", username, password).Scan(&user.ID, &user.Username, &user.Password, &user.Email, &user.BirthDate, &user.FullName)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"statusCode": http.StatusUnauthorized,
			"message":    "Invalid credentials",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"statusCode": http.StatusOK,
		"intMessage": "Operation Successful",
		"data":       user,
	})
}

// Handler for the GET API for /users
func getUsersHandler(c *gin.Context) {
	db := GetDB()
	rows, err := db.Query("SELECT id, username, email, birthDate, fullName FROM users")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": http.StatusInternalServerError,
			"message":    "Error fetching users",
		})
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.BirthDate, &user.FullName); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"statusCode": http.StatusInternalServerError,
				"message":    "Error scanning user",
			})
			return
		}
		users = append(users, user)
	}

	c.JSON(http.StatusOK, gin.H{
		"statusCode": http.StatusOK,
		"intMessage": "Operation Successful",
		"data":       users,
	})
}

// Handler for GET API for /ip using the ipapi-go library
func getIPHandler(c *gin.Context) {
	ip, err := ipapi.QueryOwnIP()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"statusCode": http.StatusBadRequest,
			"message":    "Error getting IP",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"statusCode": http.StatusOK,
		"intMessage": "Operation Successful",
		"data":       ip,
	})
}

// Handler for the POST API for /register
func registerHandler(c *gin.Context) {
	var newUser User
	if err := c.ShouldBindJSON(&newUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"statusCode": http.StatusBadRequest,
			"message":    "Invalid input data",
		})
		return
	}

	db := GetDB()
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = ? OR email = ?)", newUser.Username, newUser.Email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": http.StatusInternalServerError,
			"message":    "Error checking user existence",
		})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"statusCode": http.StatusConflict,
			"message":    "Username or Email already exists",
		})
		return
	}

	_, err = db.Exec("INSERT INTO users (username, password, email, birthDate, fullName) VALUES (?, ?, ?, ?, ?)", newUser.Username, newUser.Password, newUser.Email, newUser.BirthDate, newUser.FullName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": http.StatusInternalServerError,
			"message":    "Error registering user",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"statusCode": http.StatusCreated,
		"message":    "User registered successfully",
	})
}

// Handler for updating a user
func updateUserHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"statusCode": http.StatusBadRequest,
			"message":    "Invalid user ID",
		})
		return
	}

	var updatedUser User
	if err := c.ShouldBindJSON(&updatedUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"statusCode": http.StatusBadRequest,
			"message":    "Invalid input data",
		})
		return
	}

	db := GetDB()
	
	// Check if user exists
	var exists bool
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)", id).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"statusCode": http.StatusNotFound,
			"message":    "User not found",
		})
		return
	}

	// Check if email is already used by another user
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = ? AND id != ?)", updatedUser.Email, id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": http.StatusInternalServerError,
			"message":    "Error checking email existence",
		})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"statusCode": http.StatusConflict,
			"message":    "Email already exists",
		})
		return
	}

	_, err = db.Exec("UPDATE users SET email = ?, birthDate = ?, fullName = ?, password = ? WHERE id = ?", updatedUser.Email, updatedUser.BirthDate, updatedUser.FullName, updatedUser.Password, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": http.StatusInternalServerError,
			"message":    "Error updating user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"statusCode": http.StatusOK,
		"message":    "User updated successfully",
	})
}

// Handler for deleting a user
func deleteUserHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"statusCode": http.StatusBadRequest,
			"message":    "Invalid user ID",
		})
		return
	}

	db := GetDB()
	_, err = db.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": http.StatusInternalServerError,
			"message":    "Error deleting user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"statusCode": http.StatusOK,
		"message":    "User deleted successfully",
	})
}

func main() {
	// Create a new Gin instance
	r := gin.Default()

	// Custom CORS configuration
	config := cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Username", "Password"},
		AllowCredentials: true,
	}

	r.Use(cors.New(config))

	// Define the routes
	r.GET("/", homeHandler)
	r.GET("/users", getUsersHandler)
	r.GET("/validate", getHandler)
	r.GET("/ip", getIPHandler)
	r.POST("/register", registerHandler)
	r.PUT("/users/:id", updateUserHandler)
	r.DELETE("/users/:id", deleteUserHandler)

	// Start the server
	if err := r.Run(":8082"); err != nil {
		panic(err)
	}
}
