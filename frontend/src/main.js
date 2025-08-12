import axios from "axios";
// routes
const routes = {

  // Users
  "/users": "../public/template/user/users.html",
  "/newuser": "../public/template/user/addUser.html",

  // customers
  "/dashboard": "../public/template/dashboard.html",
  "/newCustomer": "../public/template/customer/addCustomer.html",
  "/editcustomer": "../public/template/customer/editCustomer.html",
  "/uploadData": "../public/template/csv/csv.html",
  // Alias para evitar error por mayúsculas/minúsculas
  "/uploaddata": "../public/template/csv/csv.html",

  // Login and Register
  "/registerUser": "../public/template/auth/registerUser.html",
  "/login": "../public/template/auth/login.html"
};

function isAuth() {
  const result = localStorage.getItem("Auth") || null;
  const resultBool = result === "true";
  return resultBool;
}


function setupNavigation() {
  const nav = document.getElementById("nav");
  
  if (!nav) return;
  
  const userRole = localStorage.getItem("role");

  if (!isAuth()) {
    nav.innerHTML = `
      <a href="/login" data-link>Login</a>
      <a href="/registerUser" data-link>Register</a>
    `;
    return;
  }
  
  if (userRole === "admin") {
    nav.innerHTML = `
      <a href="/dashboard" data-link>DATA CUSTOMERS</a>
      <a href="/uploadData" data-link>Upload Data</a>
      <a href="/logout" data-link id="close-sesion">Logout</a>
      <a href="/newCustomer" data-link>New customer</a>
    `;
  } else if (userRole === "user") {
    nav.innerHTML = `
      <a href="/dashborad" data-link>DATA CUSTOMERS</a>
      <a href="/logout" data-link id="close-sesion">Logout</a>
    `;
  }
}

async function navigate(pathname) {
  // Allow access to login and register pages without authentication
  if (!isAuth() && pathname !== "/login" && pathname !== "/registerUser") {
    pathname = "/login";
  }
  
  // Proteger rutas de administrador
  // const userRole = localStorage.getItem("role");
  // const adminRoutes = ["/newcustomer", "/editcustomer", "/users", "/newuser"];
  
  // if (isAuth() && userRole === "user" && adminRoutes.includes(pathname)) {
  //   alert("No tienes permisos para acceder a esta página");
  //   pathname = "/customers"; // Redirigir a customeros
  // }
  
  const route = routes[pathname];
  const html = await fetch(route).then((res) => res.text());
  document.getElementById("content").innerHTML = html;
  history.pushState({}, "", pathname);

  if (pathname === "/login") setupLoginForm();
  if (pathname === "/registerUser") register();

  // Customer
  if (pathname === "/dashboard") setupcustomers();
  if (pathname === "/newCustomer") setupAddcustomerForm();
  if (pathname === "/editcustomer") setupEditcustomerForm()

  // CSV Upload
  if (pathname === "/uploadData" || pathname === "/uploaddata") setupCsvUpload();

  // Setup navigation after loading content
  setupNavigation();
}

document.body.addEventListener("click", (e) => {
  if (e.target.matches("[data-link]")) {
    e.preventDefault();
    const path = e.target.getAttribute("href");
    
    // Manejar logout
    if (path === "/logout") {
      localStorage.setItem("Auth", "false");
      localStorage.removeItem("role");
      navigate("/login");
      return;
    }
    
    navigate(path);
  }

  // Manejar botón de editar customero
  if (e.target.matches(".edit-btn")) {
    const userRole = localStorage.getItem("role");
    
    // Verificar si el usuario es admin
    if (userRole !== "admin") {
      alert("No tienes permisos para editar customers");
      return;
    }
    
    const customerId = e.target.getAttribute("data-customer-id");
    const customerDiv = e.target.closest(".customer");
    const customerName = customerDiv.getAttribute("data-customer-name");
    const customerPrice = customerDiv.getAttribute("data-customer-price");
    const customerAmount = customerDiv.getAttribute("data-customer-amount");
    const customerIsActive = customerDiv.getAttribute("data-customer-isactive");

    // Guardar datos del customero en localStorage para usar en la página de edición
    localStorage.setItem("editingcustomer", JSON.stringify({
      id: customerId,
      customer: customerName,
      price: customerPrice,
      amount: customerAmount,
      isActive: customerIsActive
    }));
    
    navigate('/editcustomer');
   }
  // eliminar
  if (e.target.matches(".delete-btn")) {
    const userRole = localStorage.getItem("role");
    
    // Verificar si el usuario es admin
    if (userRole !== "admin") {
      alert("No tienes permisos para eliminar customeros");
      return;
    }
    
    const customerDiv = e.target.closest(".customer");
    const customerName = customerDiv.querySelector("h2").textContent;
    const customerId = e.target.getAttribute("data-customer-id");
    
    if (confirm(`¿Estás seguro de que quieres eliminar el customero: ${customerName}?`)) {
      // Eliminar del servidor
      axios.delete(`http://localhost:3000/api/customers/${customerId}`)
        .then(() => {
          customerDiv.remove();
          console.log("customer deleted");
        })
        .catch(error => {
          console.error("Error al eliminar customero:", error);
          alert("Error al eliminar el customero");
        });
    }
  }
});

async function setupcustomers() {
  try {
    const response = await axios.get("http://localhost:3000/api/customers");
    const data = response.data || [];
    console.log("Datos de customeros recibidos:", data);
    
    // Verificar estructura del primer customero
    if (data.length > 0) {
      console.log("Estructura del primer customer:", data[0]);
      console.log("Propiedades disponibles:", Object.keys(data[0]));
    }
    
    const content = document.getElementById("content");
    
    // Limpiar contenido previo
    content.innerHTML = "";
    const url = "http://localhost:3000/api/customers";
    if(localStorage.getItem("role") === "admin"){
      data.forEach(customer => {
      const customerDIV = document.createElement("div");
      customerDIV.classList.add("customer");
      customerDIV.setAttribute("data-customer-id", customer.customerID);
      customerDIV.setAttribute("data-customer-customerName", customer.customerName);
      customerDIV.setAttribute("data-customer-addres", customer.address);
      customerDIV.setAttribute("data-customer-telephone", customer.telephone);
      customerDIV.setAttribute("data-customer-email", customer.email);
      customerDIV.innerHTML = `
        <h2>Name: ${customer.customerName || 'without name'}</h2>
        <p>addres: $${customer.address || 'without address'}</p>
        <p>telephone: ${customer.telephone || 'without Telephone'}</p>
        <p>Email: ${customer.email || 'without email'}</p>
        <button class="edit-btn" data-customer-id="${customer.customerID}">Edit</button>
        <button class="delete-btn" data-customer-id="${customer.customerID}">Delete</button>
      `;
      content.appendChild(customerDIV);
    });
    } else {
      data.forEach(customer => {
        const customerDiv = document.createElement("div");
        customerDiv.classList.add("customer");
        customerDiv.innerHTML = `
          <h2>N${customer.customerName || 'without name'}</h2>
          <p>email: $${customer.address || 'without email'}</p>
          <p>Amount: ${customer.telephone || 'without Telephone'}</p>
          <p>Active: ${customer.email}</p>
        `;
        content.appendChild(customerDiv);
      });
    }
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}



// Setup Add customer Form
function setupAddcustomerForm() {
  const form = document.getElementById("form_add_customer");

  if (!form) {
    console.error("Add customer form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const customerName = document.getElementById("customerName")?.value || "";
    const address = document.getElementById("customerAddress")?.value || "";
    const telephone = document.getElementById("customerTelephone")?.value || "";
    const email = document.getElementById("customerEmail")?.value || "";

    await axios.post("http://localhost:3000/api/customers", { customerName: customerName, address, telephone, email });
    navigate("/dashboard");
  });
}

// Setup Edit customer Form
function setupEditcustomerForm() {
  const form = document.getElementById("editCustomer");

  if (!form) {
    console.error("Edit customer form not found");
    return;
  }

  // Obtener datos del customer a editar
  const customerData = JSON.parse(localStorage.getItem("editingcustomer") || "{}");
  
  // Llenar el formulario con los datos actuales
  const customerName = document.getElementById("newcustomerName");
  const address = document.getElementById("newaddress");
  const telephone = document.getElementById("newtelephone");
  const email = document.getElementById("newemail");
  
  if (customerName && customerData.customerName) {
    customerName.value = customerData.customerName;
  }
  if (address && customerData.address) {
    address.value = customerData.address;
  }
  if (telephone && customerData.telephone) {
    telephone.value = customerData.telephone;
  }
  if (email && customerData.email) {
    email.value = customerData.email;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newcustomerName = document.getElementById("customerName")?.value || "";
    const newcustomerAddress = document.getElementById("customerAddress")?.value || "";
    const newcustomerTelephone = document.getElementById("customerTelephone")?.value || "";
    const newCustomerEmail = document.getElementById("customerEmail")?.value || "";

    console.log("Actualizando customer:", {
      id: customerData.customerID,
      customerName: newcustomerName,
      address: newcustomerAddress,
      telephone: newcustomerTelephone,
      email: newCustomerEmail
    });

    try {
      await axios.put(`http://localhost:3000/api/customers/${customerData.id}`, { 
        customerName: newcustomerName, 
        address: newcustomerAddress,
        telephone: newcustomerTelephone,
        email: newCustomerEmail
      });
      
      // Limpiar datos temporales
      localStorage.removeItem("editingcustomer");
      
      alert("customer actualizado exitosamente");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error al actualizar customero:", error);
      alert("Error al actualizar el customero");
    }
  });
}

// login
function setupLoginForm() {
  const form = document.getElementById("form_login");
  
  if (!form) {
    console.error("Login form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = document.getElementById("user")?.value || "";
    const pass = document.getElementById("password")?.value || "";

    try {
      const { data } = await axios.post("http://localhost:3000/api/auth/login", { user, password: pass });

      if (data?.ok) {
        localStorage.setItem("Auth", "true");
        localStorage.setItem("role", data.role || "user");
        setupNavigation();
        navigate("/dashboard");
      } else {
        alert("usuario o contraseña son incorrectos");
      }
    } catch (err) {
      alert("usuario o contraseña son incorrectos");
    }
  });
}

function register() {
  const form = document.getElementById("form_register");
  
  if (!form) {
    console.error("Register form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = document.getElementById("user")?.value || "";
    const lastName = document.getElementById("lastName")?.value || "";
    const age = document.getElementById("age")?.value || "";
    const rol = document.getElementById("role")?.value || "user";
    const password = document.getElementById("password")?.value || "";

    try {
      await axios.post("http://localhost:3000/api/users", { name: user, lastName, age, role: rol, password });
      localStorage.setItem("Auth", "true");
      localStorage.setItem("role", rol);
      alert("Usuario registrado exitosamente");
      setupNavigation();
      navigate("/dashboard");
    } catch (err) {
      alert("Error registrando usuario");
    }
  });
}


window.addEventListener("DOMContentLoaded", () => {
  navigate(location.pathname);
});

window.addEventListener("popstate", () => {
  console.log("se hizo clic");
  console.log(location);
  navigate(location.pathname);
});

function setupCsvUpload() {
  const form = document.getElementById('csvForm');
  if (!form) return;
  const fileInput = document.getElementById('csvFile');
  const btn = document.getElementById('uploadBtn');
  const out = document.getElementById('output');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput?.files?.length) return;

    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }
    if (out) { out.hidden = true; out.textContent = ''; }

    const data = new FormData();
    data.append('file', fileInput.files[0]);

    try {
      const res = await fetch('http://localhost:3000/api/csv/upload', {
        method: 'POST',
        body: data
      });
      const json = await res.json();
      if (out) { out.hidden = false; out.textContent = JSON.stringify(json, null, 2); }
    } catch (err) {
      if (out) { out.hidden = false; out.textContent = 'Error: ' + (err?.message || err); }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Subir y procesar'; }
    }
  });
}