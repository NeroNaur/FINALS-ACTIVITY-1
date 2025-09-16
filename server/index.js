// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve images placed in server/public/images via /images route
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// In-memory storage for genres (in production, use a database)
let genres = [
  { id: 1, name: 'Action', description: 'Fast-paced, stunt-heavy films', image: '/images/action.jpg', createdAt: new Date().toISOString() },
  { id: 2, name: 'Comedy', description: 'Funny films to make you laugh', image: '/images/comedy.jpg', createdAt: new Date().toISOString() },
  { id: 3, name: 'Drama', description: 'Emotion-driven storytelling', image: '/images/drama.jpg', createdAt: new Date().toISOString() },
  { id: 4, name: 'Sci-Fi', description: 'Futuristic concepts and tech', image: '/images/scifi.jpg', createdAt: new Date().toISOString() }
];

// Helper function to get next ID
let nextId = 5;
const getNextId = () => nextId++;

// Helper function to find genre by ID
const findGenreById = (id) => genres.find(g => g.id === parseInt(id));

// Helper function for validation
const validateGenre = (genre) => {
  const errors = [];
  if (!genre.name || genre.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (!genre.description || genre.description.trim().length < 5) {
    errors.push('Description must be at least 5 characters long');
  }
  return errors;
};

// CRUD Routes

// GET /api/genres - Get all genres
app.get('/api/genres', (req, res) => {
  try {
    // Optional query parameters for filtering and sorting
    const { sort, order = 'asc', search } = req.query;
    let result = [...genres];

    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(g => 
        g.name.toLowerCase().includes(searchLower) || 
        g.description.toLowerCase().includes(searchLower)
      );
    }

    // Sorting functionality
    if (sort) {
      result.sort((a, b) => {
        let aVal = a[sort];
        let bVal = b[sort];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (order === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    res.json({
      success: true,
      data: result,
      total: result.length,
      message: 'Genres retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving genres',
      error: error.message
    });
  }
});

// GET /api/genres/:id - Get single genre by ID
app.get('/api/genres/:id', (req, res) => {
  try {
    const genre = findGenreById(req.params.id);
    
    if (!genre) {
      return res.status(404).json({
        success: false,
        message: 'Genre not found'
      });
    }

    res.json({
      success: true,
      data: genre,
      message: 'Genre retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving genre',
      error: error.message
    });
  }
});

// POST /api/genres - Create new genre
app.post('/api/genres', (req, res) => {
  try {
    const { name, description, image } = req.body;
    
    // Validate input
    const errors = validateGenre({ name, description });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check if genre with same name already exists
    const existingGenre = genres.find(g => 
      g.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existingGenre) {
      return res.status(409).json({
        success: false,
        message: 'Genre with this name already exists'
      });
    }

    // Create new genre
    const newGenre = {
      id: getNextId(),
      name: name.trim(),
      description: description.trim(),
      image: image || `/images/${name.toLowerCase().replace(/\s+/g, '')}.jpg`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    genres.push(newGenre);

    res.status(201).json({
      success: true,
      data: newGenre,
      message: 'Genre created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating genre',
      error: error.message
    });
  }
});

// PUT /api/genres/:id - Update genre by ID (full update)
app.put('/api/genres/:id', (req, res) => {
  try {
    const genreIndex = genres.findIndex(g => g.id === parseInt(req.params.id));
    
    if (genreIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Genre not found'
      });
    }

    const { name, description, image } = req.body;
    
    // Validate input
    const errors = validateGenre({ name, description });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check if another genre with same name exists (excluding current one)
    const existingGenre = genres.find(g => 
      g.id !== parseInt(req.params.id) && 
      g.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existingGenre) {
      return res.status(409).json({
        success: false,
        message: 'Another genre with this name already exists'
      });
    }

    // Update genre
    const updatedGenre = {
      ...genres[genreIndex],
      name: name.trim(),
      description: description.trim(),
      image: image || genres[genreIndex].image,
      updatedAt: new Date().toISOString()
    };

    genres[genreIndex] = updatedGenre;

    res.json({
      success: true,
      data: updatedGenre,
      message: 'Genre updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating genre',
      error: error.message
    });
  }
});

// PATCH /api/genres/:id - Partial update of genre
app.patch('/api/genres/:id', (req, res) => {
  try {
    const genreIndex = genres.findIndex(g => g.id === parseInt(req.params.id));
    
    if (genreIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Genre not found'
      });
    }

    const updates = {};
    const allowedFields = ['name', 'description', 'image'];
    
    // Only include provided fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = field === 'name' || field === 'description' 
          ? req.body[field].trim() 
          : req.body[field];
      }
    });

    // Validate if name or description is being updated
    if (updates.name || updates.description) {
      const testGenre = {
        name: updates.name || genres[genreIndex].name,
        description: updates.description || genres[genreIndex].description
      };
      
      const errors = validateGenre(testGenre);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
    }

    // Check for duplicate name if name is being updated
    if (updates.name) {
      const existingGenre = genres.find(g => 
        g.id !== parseInt(req.params.id) && 
        g.name.toLowerCase() === updates.name.toLowerCase()
      );
      if (existingGenre) {
        return res.status(409).json({
          success: false,
          message: 'Another genre with this name already exists'
        });
      }
    }

    // Apply updates
    const updatedGenre = {
      ...genres[genreIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    genres[genreIndex] = updatedGenre;

    res.json({
      success: true,
      data: updatedGenre,
      message: 'Genre updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating genre',
      error: error.message
    });
  }
});

// DELETE /api/genres/:id - Delete genre by ID
app.delete('/api/genres/:id', (req, res) => {
  try {
    const genreIndex = genres.findIndex(g => g.id === parseInt(req.params.id));
    
    if (genreIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Genre not found'
      });
    }

    const deletedGenre = genres[genreIndex];
    genres.splice(genreIndex, 1);

    res.json({
      success: true,
      data: deletedGenre,
      message: 'Genre deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting genre',
      error: error.message
    });
  }
});

// DELETE /api/genres - Delete multiple genres (bulk delete)
app.delete('/api/genres', (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of genre IDs to delete'
      });
    }

    const deletedGenres = [];
    const notFoundIds = [];

    ids.forEach(id => {
      const genreIndex = genres.findIndex(g => g.id === parseInt(id));
      if (genreIndex !== -1) {
        deletedGenres.push(genres[genreIndex]);
        genres.splice(genreIndex, 1);
      } else {
        notFoundIds.push(id);
      }
    });

    res.json({
      success: true,
      data: {
        deleted: deletedGenres,
        deletedCount: deletedGenres.length,
        notFound: notFoundIds
      },
      message: `${deletedGenres.length} genres deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting genres',
      error: error.message
    });
  }
});

// Simple health route
app.get('/api/ping', (req, res) => {
  res.json({ 
    ok: true, 
    time: Date.now(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for API routes
app.use('/api/', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET    /api/genres         - Get all genres`);
  console.log(`  GET    /api/genres/:id     - Get genre by ID`);
  console.log(`  POST   /api/genres         - Create new genre`);
  console.log(`  PUT    /api/genres/:id     - Update genre (full)`);
  console.log(`  PATCH  /api/genres/:id     - Update genre (partial)`);
  console.log(`  DELETE /api/genres/:id     - Delete genre by ID`);
  console.log(`  DELETE /api/genres         - Delete multiple genres`);
});