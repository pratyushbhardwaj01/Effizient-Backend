require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs/promises");
const lodash = require("lodash");

const PORT = 3000;
const app = express();

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log(process.env.SENDGRID_API_KEY);

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

var whitelist = ["http://localhost:5173", "https://sop-formm.netlify.app"];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.json({ message: "hello world" });
});

app.post("/submit-form", async (req, res) => {
  const { email, fullName, ...restProp } = req.body || {};

  const rows = Object.entries(req.body)
    .map(([key, val]) => {
      if (!key || !val) {
        return "";
      }
      return `<tr>
        <td>${lodash.startCase(key)}</td>
        <td>${val}</td>
    </tr>`;
    })
    .join("");

  const html = `<html><style>
  table {
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid orange;
    padding: 10px;
    text-align: left;
  }
</style><body>
<h2>Here are your details</h2>
<table>${rows}</table></body></html>`;

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.API_KEY,
      "content-type": "application/json",
    },

    body: JSON.stringify({
      sender: {
        name: "No Reply",
        email: "no-reply@pratyush.com",
      },
      to: [
        {
          email,
          name: fullName,
        },
      ],
      subject: "Statement of Purpose for " + fullName,
      htmlContent: html,
    }),
  });
  res.status(200).send("form data received successfully");
});

app.listen(PORT, () => {
  console.log("server is running ");
});
