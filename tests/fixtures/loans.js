const { db } = require('../../src/db');

function seedMemberBook() {
  db.prepare(`
    INSERT INTO books (isbn, title, author, genre, year, totalCopies, availableCopies)
    VALUES ('9780000000001', 'Test Book', 'Test Author', 'Test', 2020, 3, 3)
  `).run();

  db.prepare(`
    INSERT INTO members (name, email, memberNumber, status)
    VALUES ('Jane Doe', 'jane@example.com', 'MEM001', 'active')
  `).run();
}

function insertLoan({
  borrowDate,
  dueDate,
  returnDate = null,
  status = 'active',
  fee = 0,
  bookId = 1,
  memberId = 1,
}) {
  const result = db.prepare(`
    INSERT INTO loans (bookId, memberId, borrowDate, dueDate, returnDate, status, fee)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(bookId, memberId, borrowDate, dueDate, returnDate, status, fee);

  return result.lastInsertRowid;
}

module.exports = { seedMemberBook, insertLoan };
