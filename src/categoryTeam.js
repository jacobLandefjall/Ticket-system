const express = require('express');
const { requiresAuth } = require('express-openid-connect');
require('dotenv').config();

const getTeamByCategoryId = (categoryId, callback) => {
    const query = 'SELECT team_id FROM Categories WHERE id = ?';
    connection.query(query, [categoryId], (error, results) => {
        if (error) {
            console.error("Error fetching team by category ID:", error);
            return callback(error);
        }
        // Check if the category exists
        if (results.length === 0) {
            return callback(new Error("Category not found"));
        }
        const teamId = results[0].team_id;
        callback(null, teamId);
    });
};

module.export = {getTeamByCategoryId}
