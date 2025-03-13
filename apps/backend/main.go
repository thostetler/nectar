package main

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.
	r.Use(middleware.Timeout(60 * time.Second))
	workDir, _ := os.Getwd()
	baseDir := filepath.Join(workDir, "../ui/dist")
	staticDir := http.Dir(filepath.Join(workDir, "../ui/dist/_next/static"))
	FileServer(r, "/_next/static", staticDir)

	AddHTMLRoute(r, "/", filepath.Join(baseDir, "index.html"))
	AddHTMLRoute(r, "/classic-form", filepath.Join(baseDir, "classic-form.html"))
	AddHTMLRoute(r, "/paper-form", filepath.Join(baseDir, "paper-form.html"))

	println("Server is running on port 8000")
	http.ListenAndServe(":8000", r)
}

func FileServer(r chi.Router, path string, root http.FileSystem) {
	if strings.ContainsAny(path, "{}*") {
		panic("FileServer does not permit any URL parameters.")
	}

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", 301).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(pathPrefix, http.FileServer(root))
		fs.ServeHTTP(w, r)
	})
}

func AddHTMLRoute(r chi.Router, routePath string, filePath string) {
	r.Get(routePath, func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filePath)
	})
}
