//Author: Alec Bozzo
//Class: CS408 - Software Development for Computer Systems
//Assignment: Canvas CLI App

//this is a interactive command line that will list your coureses and assignments from the course using generated API tokens from canvas.

//Table is generated using chalk and utilizing color cyan.

//using env to load api tokens

require('dotenv').config();
const fetch = require('node-fetch');
const chalk = require('chalk');

//API config params
const API_TOKEN = process.env.CANVAS_API_TOKEN;
const BASE_URL = process.env.CANVAS_INSTANCE_URL;

//fetcher of the pages using
// @params url - the url to fetch
// @params headers - any additional headers to include in the request
async function fetchAllPages(url, headers = {}) {
  const results = [];
  let nextUrl = url;

  while (nextUrl) {
    try {
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          ...headers
        }
      });

      if (!response.ok) {
        throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      results.push(...data);

      //paganation handling
      const linkHeader = response.headers.get('link');
      nextUrl = null;

      if (linkHeader) {
        const links = linkHeader.split(',');
        for (const link of links) {
          if (link.includes('rel="next"')) {
            const match = link.match(/<([^>]+)>/);
            if (match) {
              nextUrl = match[1];
            }
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  return results;
}

// Fetch all courses
async function listCourses() {
  try {

    const url = `${BASE_URL}/api/v1/courses?state=available`;
    const courses = await fetchAllPages(url);
    //check sum for courses
    if (courses.length === 0) { 
      console.log(chalk.yellow('No courses found.'));
      return null;
    }

    //display courses in a formatted table
    console.log(chalk.cyan('─'.repeat(80)));
    console.log(chalk.cyan.bold('ID').padEnd(15) + chalk.cyan.bold('Course Name'));
    console.log(chalk.cyan('─'.repeat(80)));

    //formatting the courses in a table
    courses.forEach((course) => {
      console.log(chalk.white(String(course.id).padEnd(15) + course.name));
    });
    
    console.log(chalk.cyan('─'.repeat(80)));
    console.log(chalk.green(`\nTotal courses: ${courses.length}\n`));

    return courses;
  } catch (error) {
    return error;
  }
}

//assignment fetcher for specific courses
async function listAssignments(courseId) {
  try {

    const url = `${BASE_URL}/api/v1/courses/${courseId}/assignments`;
    const assignments = await fetchAllPages(url);

    if (assignments.length === 0) {
      console.log(chalk.yellow('No assignments found for this course.'));
      return;
    }

    //assignments in a similar table table
    console.log(chalk.cyan('─'.repeat(80)));
    console.log(
      chalk.cyan.bold('ID'.padEnd(10)) +
      chalk.cyan.bold('Name'.padEnd(50)) +
      chalk.cyan.bold('Due Date'.padEnd(30)) +
      chalk.cyan.bold('Points')
    );
    console.log(chalk.cyan('─'.repeat(80)));

    //loop assignments in the table
    assignments.forEach((assignment) => {
      const dueDate = assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : 'No due date';
      const points = assignment.points_possible || 'N/A';

      console.log(
        chalk.white(String(assignment.id).padEnd(10)) +
        chalk.white(assignment.name.substring(0, 48).padEnd(50)) +
        chalk.white(dueDate.padEnd(30)) +
        chalk.white(String(points))
      );
    });

    console.log(chalk.cyan('─'.repeat(120)));
    console.log(chalk.green(`\nTotal assignments: ${assignments.length}\n`));
  } catch (error) {
    return error;
  }
}

// Main function
async function main() {

  const args = process.argv.slice(2);
  const command = args[0];

  // If a course ID is provided as argument, fetch assignments for that course
  if (command && !isNaN(command)) { //check if there is a command and if its a course ID
    const courseId = parseInt(command);
    await listAssignments(courseId);
  } else {
    // Otherwise, list courses
    const courses = await listCourses();
  }
}

main();
