import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, LayoutDashboard, ShoppingCart, Users, Settings, 
  DollarSign, Package, Bell, MessageCircle, Plus, Trash2, Edit2, 
  Check, X, Search, Filter, Eye, Printer, AlertTriangle, ShieldCheck, 
  LogOut, UserCheck, Calendar, ArrowRight, RefreshCw, KeyRound, CheckCircle2,
  Image as ImageIcon, Building, Lock, UserPlus, Phone, Mail, FileText, Shield, Upload, History
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function GourmetPOS() {
  // --- AUTENTICACIÓN & ROLES ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('admin@gourmetpos.com');
  const [loginPin, setLoginPin] = useState('1234');
  const [loginError, setLoginError] = useState('');

  // --- CONTROL DE APERTURA Y ESTADO DE CAJA ---
  const [cajaAbierta, setCajaAbierta] = useState(true); // Control de turno activo
  const [modalAperturaOpen, setModalAperturaOpen] = useState(false);
  const [baseApertura, setBaseApertura] = useState(150000);
  const [tipoCierreSeleccionado, setTipoCierreSeleccionado] = useState('turno'); // 'turno' | 'jornada'

  // --- HISTORIAL DE CIERRES REGISTRADOS (SOLO GUARDA POS) ---
  const [historialCierres, setHistorialCierres] = useState([
    {
      id: 'CR-101',
      fecha: '2026-10-31 23:55',
      tipo: 'jornada',
      responsable: 'Yanry Admin',
      baseApertura: 150000,
      ventasEfectivo: 89240,
      ventasTransferencia: 0,
      totalPropinas: 5000,
      totalDomicilios: 6000,
      totalVentas: 89240,
      efectivoEsperado: 239240,
      efectivoContado: 300000,
      diferencia: 60760,
      balanceTexto: 'Sobrante en Caja'
    }
  ]);

  // Submenú de impresión multiformato para cierres
  const [cierreActivoParaImprimir, setCierreActivoParaImprimir] = useState(null);
  const [subModalReportesOpen, setSubModalReportesOpen] = useState(false);
  const [reporteCierreTipo, setReporteCierreTipo] = useState(null); // 'pos' | 'mesero' | 'servicio' | 'domicilios' | null

  // Denominaciones físicas del arqueo
  const [denominaciones, setDenominaciones] = useState({
    b100k: 0, b50k: 0, b20k: 0, b10k: 0, b5k: 0, b2k: 0,
    m1000: 0, m500: 0, m200: 0, m100: 0, m50: 0
  });
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);

  // --- CONFIGURACIÓN DE LA EMPRESA & LOGOS ---
  const [empresa, setEmpresa] = useState({
    nombre: 'PAL HORNO',
    nit: '901.458.789-1',
    telefono: '+57 314 555 0199',
    correo: 'contacto@palhorno.com',
    direccion: 'Calle 15 # 40-20, Centro Comercial',
    representante_legal: 'Yanry Administrador',
    eslogan: 'El auténtico sabor a la leña y parrilla'
  });

  const [logos, setLogos] = useState({
    app: '',
    login: '',
    pos: ''
  });

  const [configSubTab, setConfigSubTab] = useState('informacion');

  // --- USUARIOS COMPLETOS (4 BLOQUES) ---
  const [usuarios, setUsuarios] = useState([
    { 
      id: 'usr-1', 
      nombre: 'Yanry', 
      apellidos: 'Admin', 
      cedula: '1121890123', 
      telefono: '3145550199', 
      email: 'admin@gourmetpos.com', 
      pin: '1234', 
      bloque: 'administrativo', 
      fechaIngreso: '2026-01-15', 
      foto: '', 
      contactoEmergencia: { nombre: 'María Parra', telefono: '3108889900' },
      modulos: ['mesas', 'menu', 'materia_prima', 'recetas', 'compras', 'facturas', 'cierre', 'registro_cierres', 'configuracion', 'solicitudes'] 
    },
    { 
      id: 'usr-2', 
      nombre: 'Valeria', 
      apellidos: 'Gómez', 
      cedula: '1006789456', 
      telefono: '3204441122', 
      email: 'valeria@gourmetpos.com', 
      pin: '2222', 
      bloque: 'cajeros', 
      fechaIngreso: '2026-03-01', 
      foto: '', 
      contactoEmergencia: { nombre: 'Pedro Gómez', telefono: '3157776655' },
      modulos: ['mesas', 'facturas', 'cierre', 'registro_cierres', 'materia_prima'] 
    },
    { 
      id: 'usr-3', 
      nombre: 'Mateo', 
      apellidos: 'Morales', 
      cedula: '1012345678', 
      telefono: '3129998877', 
      email: 'mateo@gourmetpos.com', 
      pin: '3333', 
      bloque: 'meseros', 
      fechaIngreso: '2026-05-10', 
      foto: '', 
      contactoEmergencia: { nombre: 'Rosa Morales', telefono: '3112223344' },
      modulos: ['mesas', 'materia_prima'] 
    },
    { 
      id: 'usr-4', 
      nombre: 'Daniel', 
      apellidos: 'Chef Principal', 
      cedula: '1120987654', 
      telefono: '3136665544', 
      email: 'daniel@gourmetpos.com', 
      pin: '4444', 
      bloque: 'cocina', 
      fechaIngreso: '2026-02-20', 
      foto: '', 
      contactoEmergencia: { nombre: 'Luisa Sánchez', telefono: '3189990011' },
      modulos: ['materia_prima', 'recetas'] 
    }
  ]);

  const [modalUsuario, setModalUsuario] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userFormData, setUserFormData] = useState({
    nombre: '', apellidos: '', cedula: '', telefono: '', email: '', pin: '',
    bloque: 'meseros', fechaIngreso: new Date().toISOString().substring(0, 10), foto: '',
    emergenciaNombre: '', emergenciaTelefono: '', modulos: ['mesas']
  });

  const [permisosDetalle, setPermisosDetalle] = useState({
    'mesas.reabrir': ['usr-1'],
    'mesas.editar_plano': ['usr-1'],
    'facturas.anular': ['usr-1'],
    'facturas.cortesia': ['usr-1', 'usr-2'],
    'menu.cambiar_precios': ['usr-1'],
    'materia_prima.crear_insumos': ['usr-1', 'usr-4'],
    'materia_prima.aprobar_solicitud': ['usr-1'],
    'cierre.auditoria_ciega': ['usr-1']
  });

  const [activeTab, setActiveTab] = useState('mesas');

  // --- MATERIA PRIMA ---
  const [materiaPrima, setMateriaPrima] = useState([
    { id: 'ins-1', nombre: 'Carne de Res Molida 80/20', grupo: 'Carnes', unidad: 'kg', stock: 12.5, minimo: 5.0, costo: 28000 },
    { id: 'ins-2', nombre: 'Pan Brioche Artesanal', grupo: 'Panadería', unidad: 'unidades', stock: 14, minimo: 20, costo: 2500 },
    { id: 'ins-3', nombre: 'Queso Cheddar Tajado', grupo: 'Lácteos', unidad: 'kg', stock: 1.8, minimo: 3.0, costo: 32000 },
    { id: 'ins-4', nombre: 'Papas Rústicas Precocidas', grupo: 'Congelados', unidad: 'kg', stock: 25.0, minimo: 10.0, costo: 8500 },
    { id: 'ins-5', nombre: 'Gaseosa Coca Cola 400ml', grupo: 'Bebidas', unidad: 'unidades', stock: 48, minimo: 12, costo: 2800 }
  ]);

  // --- MENÚ DE VENTAS ---
  const [categoriasMenu, setCategoriasMenu] = useState(['Hamburguesas', 'Parrilla', 'Bebidas', 'Entradas', 'Postres']);
  const [selectedCategoriaMenu, setSelectedCategoriaMenu] = useState('Hamburguesas');
  
  const [menuItems, setMenuItems] = useState([
    { 
      id: 'plato-1', 
      nombre: 'Hamburguesa Royal Bacon', 
      categoria: 'Hamburguesas', 
      precio: 32000, 
      impuesto: 8, 
      imagen: '🍔',
      descripcion: 'Pan brioche artesanal, 180g carne Angus, queso cheddar y tocineta ahumada.',
      receta: [
        { insumoId: 'ins-2', cantidad: 1 },
        { insumoId: 'ins-1', cantidad: 0.18 },
        { insumoId: 'ins-3', cantidad: 0.05 }
      ]
    },
    { 
      id: 'plato-2', 
      nombre: 'Porción Papas Rústicas', 
      categoria: 'Entradas', 
      precio: 14000, 
      impuesto: 8, 
      imagen: '🍟',
      descripcion: 'Papas crujientes con especias y dip de ajo.',
      receta: [
        { insumoId: 'ins-4', cantidad: 0.25 }
      ]
    },
    { 
      id: 'plato-3', 
      nombre: 'Coca Cola 400ml', 
      categoria: 'Bebidas', 
      precio: 6000, 
      impuesto: 0, 
      imagen: '🥤',
      descripcion: 'Gaseosa helada con hielo y limón.',
      receta: [
        { insumoId: 'ins-5', cantidad: 1 }
      ]
    }
  ]);

  const [modalReceta, setModalReceta] = useState(null);
  const [tempReceta, setTempReceta] = useState([]);
  const [nuevoInsumoReceta, setNuevoInsumoReceta] = useState({ insumoId: '', cantidad: '' });

  // --- MESAS DEL SALÓN ---
  const [isEditPlano, setIsEditPlano] = useState(false);
  const [tables, setTables] = useState([
    { id: 1, nombre: 'Mesa 1', capacidad: 4, forma: 'cuadrada', x: 50, y: 50, estado: 'libre', mesero: null, comanda: [] },
    { id: 2, nombre: 'Mesa 2', capacidad: 4, forma: 'cuadrada', x: 200, y: 50, estado: 'libre', mesero: null, comanda: [] },
    { id: 3, nombre: 'Mesa 3 VIP', capacidad: 6, forma: 'rectangular', x: 350, y: 50, estado: 'ocupada', mesero: 'Mateo Morales', comanda: [{ ...menuItems[0], cantidad: 2 }, { ...menuItems[1], cantidad: 1 }] },
    { id: 4, nombre: 'Mesa 4', capacidad: 2, forma: 'redonda', x: 50, y: 200, estado: 'libre', mesero: null, comanda: [] },
    { id: 5, nombre: 'Barra 1', capacidad: 1, forma: 'redonda', x: 200, y: 200, estado: 'libre', mesero: null, comanda: [] },
    { id: 6, nombre: 'Terraza 1', capacidad: 4, forma: 'cuadrada', x: 350, y: 200, estado: 'libre', mesero: null, comanda: [] }
  ]);
  const [selectedTable, setSelectedTable] = useState(null);

  // --- MODAL DE FACTURACIÓN ---
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payServiceType, setPayServiceType] = useState('mesa');
  const [clientData, setClientData] = useState({ nombre: 'Consumidor Final', nit: '222222222222' });
  const [domicilioData, setDomicilioData] = useState({ valor: 6000, repartidor: 'Carlos Domicilios' });
  const [payMethod, setPayMethod] = useState('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [propinaVoluntaria, setPropinaVoluntaria] = useState(0);

  // --- FACTURAS EN VIVO (TURNO ACTUAL) ---
  const [facturas, setFacturas] = useState([
    {
      id: 'FACT-1001',
      fecha: '2026-10-31 19:40',
      cliente: 'Carlos Méndez',
      doc: '1121890456',
      tipo: 'mesa',
      mesa: 'Mesa 2',
      cajero: 'Mateo Morales',
      repartidor: null,
      metodo: 'efectivo',
      subtotal: 78000,
      impuesto: 6240,
      propina: 5000,
      domicilio: 0,
      total: 89240,
      vuelto: 10760,
      items: [
        { nombre: 'Hamburguesa Royal Bacon', cantidad: 2, precio: 32000 },
        { nombre: 'Porción Papas Rústicas', cantidad: 1, precio: 14000 }
      ]
    },
    {
      id: 'FACT-1002',
      fecha: '2026-10-31 20:15',
      cliente: 'Laura Vega',
      doc: '1002345678',
      tipo: 'domicilio',
      mesa: 'Directa',
      cajero: 'Valeria Gómez',
      repartidor: 'Carlos Domicilios',
      metodo: 'efectivo',
      subtotal: 32000,
      impuesto: 2560,
      propina: 2000,
      domicilio: 6000,
      total: 42560,
      vuelto: 7440,
      items: [
        { nombre: 'Hamburguesa Royal Bacon', cantidad: 1, precio: 32000 }
      ]
    }
  ]);
  const [filtroFacturaCliente, setFiltroFacturaCliente] = useState('');
  const [filtroFacturaFecha, setFiltroFacturaFecha] = useState('');
  const [filtroFacturaProducto, setFiltroFacturaProducto] = useState('');
  const [facturaImprimir, setFacturaImprimir] = useState(null);

  // --- COMPRAS MULTI-ÍTEM ---
  const [comprasHistorial, setComprasHistorial] = useState([]);
  const [compraHeader, setCompraHeader] = useState({
    proveedor: '',
    factura: '',
    fecha: new Date().toISOString().substring(0, 10)
  });
  const [compraItems, setCompraItems] = useState([
    { insumoId: '', marca: '', cantidad: '', costoUnitario: '', caducidad: '' }
  ]);

  // --- SOLICITUDES DE STOCK ---
  const [solicitudesStock, setSolicitudesStock] = useState([
    {
      id: 'SOL-01',
      insumoId: 'ins-2',
      insumoNombre: 'Pan Brioche Artesanal',
      unidad: 'unidades',
      cantidadSolicitada: 30,
      solicitante: 'Mateo Morales (Mesero)',
      fecha: '2026-10-31 18:20',
      observacion: 'Quedan solo 14 panes en stock.',
      estado: 'pendiente'
    }
  ]);
  const [modalSolicitud, setModalSolicitud] = useState(null);
  const [cantSolicitar, setCantSolicitar] = useState('');
  const [obsSolicitud, setObsSolicitud] = useState('');

  // Supabase sync
  useEffect(() => {
    async function loadData() {
      try {
        const { data: dbEmpresa } = await supabase.from('empresa_config').select('*').single();
        if (dbEmpresa) setEmpresa(dbEmpresa);
        const { data: dbInsumos } = await supabase.from('materia_prima').select('*');
        if (dbInsumos && dbInsumos.length > 0) setMateriaPrima(dbInsumos);
      } catch (err) {
        console.log('Modo local.');
      }
    }
    loadData();
  }, []);

  // --- AUTOMATIZACIÓN DE CIERRE A LAS 00:00 (MEDIANOCHE) ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0 && cajaAbierta) {
        ejecutarCierreAutomaticoMedianoche();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [cajaAbierta, baseApertura, facturas, currentUser]);

  const ejecutarCierreAutomaticoMedianoche = () => {
    const vEf = facturas.filter(f => f.metodo === 'efectivo').reduce((acc, f) => acc + f.total, 0);
    const vTr = facturas.filter(f => f.metodo === 'transferencia').reduce((acc, f) => acc + f.total, 0);
    const pTot = facturas.reduce((acc, f) => acc + (Number(f.propina) || 0), 0);
    const dTot = facturas.reduce((acc, f) => acc + (Number(f.domicilio) || 0), 0);
    const esperado = Number(baseApertura) + vEf;

    const cierreAuto = {
      id: `CR-AUTO-${Date.now().toString().slice(-4)}`,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      tipo: 'jornada (00:00 Auto)',
      responsable: currentUser ? `${currentUser.nombre} ${currentUser.apellidos}` : 'Sistema Automático',
      baseApertura: Number(baseApertura),
      ventasEfectivo: vEf,
      ventasTransferencia: vTr,
      totalPropinas: pTot,
      totalDomicilios: dTot,
      totalVentas: vEf + vTr,
      efectivoEsperado: esperado,
      efectivoContado: esperado,
      diferencia: 0,
      balanceTexto: 'Cierre de Medianoche (Automático)'
    };

    setHistorialCierres(prev => [cierreAuto, ...prev]);
    setFacturas([]);
    setTables(prev => prev.map(t => ({ ...t, estado: 'libre', comanda: [], mesero: null })));
    setDenominaciones({
      b100k: 0, b50k: 0, b20k: 0, b10k: 0, b5k: 0, b2k: 0,
      m1000: 0, m500: 0, m200: 0, m100: 0, m50: 0
    });
    setBaseApertura(0);
    setCajaAbierta(false); // Requiere nueva apertura al abrir salón
    alert('⏰ Son las 00:00 horas. El sistema ha cerrado automáticamente la jornada anterior.\nDeberá ingresar la base inicial al ingresar al Salón de Mesas.');
  };

  // --- NAVEGACIÓN CONTROLADA: SALÓN DE MESAS EXIGE APERTURA ---
  const handleNavToMesas = () => {
    if (!cajaAbierta) {
      setModalAperturaOpen(true);
    } else {
      setActiveTab('mesas');
    }
  };

  const handleConfirmarApertura = (e) => {
    e.preventDefault();
    if (baseApertura === '' || Number(baseApertura) < 0 || isNaN(baseApertura)) {
      alert('Ingrese un monto válido para la base de apertura.');
      return;
    }
    setCajaAbierta(true);
    setModalAperturaOpen(false);
    setActiveTab('mesas');
  };

  // --- CÁLCULOS DINÁMICOS DE CIERRE ---
  const totalFisicoContado = (
    (denominaciones.b100k * 100000) +
    (denominaciones.b50k * 50000) +
    (denominaciones.b20k * 20000) +
    (denominaciones.b10k * 10000) +
    (denominaciones.b5k * 5000) +
    (denominaciones.b2k * 2000) +
    (denominaciones.m1000 * 1000) +
    (denominaciones.m500 * 500) +
    (denominaciones.m200 * 200) +
    (denominaciones.m100 * 100) +
    (denominaciones.m50 * 50)
  );

  const ventasEfectivo = facturas.filter(f => f.metodo === 'efectivo').reduce((acc, f) => acc + f.total, 0);
  const ventasTransferencia = facturas.filter(f => f.metodo === 'transferencia').reduce((acc, f) => acc + f.total, 0);
  const totalPropinasRecogidas = facturas.reduce((acc, f) => acc + (Number(f.propina) || 0), 0);
  const totalDomiciliosRecaudados = facturas.reduce((acc, f) => acc + (Number(f.domicilio) || 0), 0);
  const totalEfectivoEsperado = Number(baseApertura) + ventasEfectivo;
  const diferenciaArqueo = totalFisicoContado - totalEfectivoEsperado;

  // --- CONFIRMAR CIERRE SIN CERRAR SESIÓN ---
  const handleGuardarCierrePOS = () => {
    const nuevoCierre = {
      id: `CR-${100 + historialCierres.length + 1}`,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      tipo: tipoCierreSeleccionado,
      responsable: `${currentUser.nombre} ${currentUser.apellidos}`,
      baseApertura: Number(baseApertura),
      ventasEfectivo,
      ventasTransferencia,
      totalPropinas: totalPropinasRecogidas,
      totalDomicilios: totalDomiciliosRecaudados,
      totalVentas: ventasEfectivo + ventasTransferencia,
      efectivoEsperado: totalEfectivoEsperado,
      efectivoContado: totalFisicoContado,
      diferencia: diferenciaArqueo,
      balanceTexto: diferenciaArqueo === 0 ? 'Cuadre Exacto' : diferenciaArqueo > 0 ? 'Sobrante en Caja' : 'Faltante en Caja'
    };

    // 1. Guardar en el histórico
    setHistorialCierres(prev => [nuevoCierre, ...prev]);

    // 2. Reiniciar todas las ventas y pedidos en curso
    setFacturas([]);
    setTables(prev => prev.map(t => ({ ...t, estado: 'libre', comanda: [], mesero: null })));
    setSelectedTable(null);

    // 3. Limpiar denominaciones de arqueo
    setDenominaciones({
      b100k: 0, b50k: 0, b20k: 0, b10k: 0, b5k: 0, b2k: 0,
      m1000: 0, m500: 0, m200: 0, m100: 0, m50: 0
    });

    // 4. Cerrar caja para que exija apertura obligatoria al volver a Salón de Mesas
    setCajaAbierta(false);
    setBaseApertura(0);

    // 5. Cerrar modal de arqueo y abrir el submenú de reportes
    setIsCierreModalOpen(false);
    setCierreActivoParaImprimir(nuevoCierre);
    setSubModalReportesOpen(true);

    // 6. Redirigir a Registro Cierres de Caja sin tocar la sesión
    setActiveTab('registro_cierres');
  };

  // --- LOGIN HANDLER ---
  const handleLogin = (e) => {
    e.preventDefault();
    const userFound = usuarios.find(u => u.email === loginEmail && u.pin === loginPin);
    if (userFound) {
      setCurrentUser(userFound);
      setLoginError('');
      if (userFound.modulos.length > 0) {
        setActiveTab(userFound.modulos[0]);
      }
    } else {
      setLoginError('Credenciales incorrectas. Verifique correo o PIN.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginPin('');
  };

  const materiaPrimaCritica = materiaPrima.filter(m => Number(m.stock) <= Number(m.minimo));
  const solicitudesPendientes = solicitudesStock.filter(s => s.estado === 'pendiente');

  const comandaActual = selectedTable && Array.isArray(selectedTable.comanda) ? selectedTable.comanda : [];
  const subtotalComanda = comandaActual.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const impoconsumoCalculado = comandaActual.reduce((acc, item) => acc + ((item.precio * item.cantidad) * (item.impuesto / 100)), 0);
  const fleteDomicilio = (payServiceType === 'domicilio') ? Number(domicilioData.valor) : 0;
  const totalPagar = subtotalComanda + impoconsumoCalculado + fleteDomicilio + Number(propinaVoluntaria);
  const cambioEfectivo = Number(efectivoRecibido) > totalPagar ? Number(efectivoRecibido) - totalPagar : 0;

  const handleLocalImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddToComanda = (plato) => {
    if (!selectedTable) return;
    const items = Array.isArray(selectedTable.comanda) ? [...selectedTable.comanda] : [];
    const idx = items.findIndex(i => i.id === plato.id);

    let nuevaComanda;
    if (idx > -1) {
      nuevaComanda = items.map((it, i) => i === idx ? { ...it, cantidad: it.cantidad + 1 } : it);
    } else {
      nuevaComanda = [...items, { ...plato, cantidad: 1 }];
    }

    const mesaActualizada = {
      ...selectedTable,
      estado: 'ocupada',
      mesero: currentUser ? `${currentUser.nombre} ${currentUser.apellidos}` : 'Mesero',
      comanda: nuevaComanda
    };

    setSelectedTable(mesaActualizada);
    setTables(prev => prev.map(t => t.id === selectedTable.id ? mesaActualizada : t));
  };

  const handleRemoveFromComanda = (platoId) => {
    if (!selectedTable) return;
    const items = Array.isArray(selectedTable.comanda) ? [...selectedTable.comanda] : [];
    const idx = items.findIndex(i => i.id === platoId);
    if (idx === -1) return;

    let nuevaComanda;
    if (items[idx].cantidad > 1) {
      nuevaComanda = items.map((it, i) => i === idx ? { ...it, cantidad: it.cantidad - 1 } : it);
    } else {
      nuevaComanda = items.filter(it => it.id !== platoId);
    }

    const mesaActualizada = {
      ...selectedTable,
      estado: nuevaComanda.length === 0 ? 'libre' : 'ocupada',
      mesero: nuevaComanda.length === 0 ? null : selectedTable.mesero,
      comanda: nuevaComanda
    };

    setSelectedTable(mesaActualizada);
    setTables(prev => prev.map(t => t.id === selectedTable.id ? mesaActualizada : t));
  };

  const handleCompletarPago = async () => {
    if (comandaActual.length === 0) return;
    if (payMethod === 'efectivo' && Number(efectivoRecibido) < totalPagar) {
      alert('El monto en efectivo ingresado es menor al total a pagar.');
      return;
    }

    const nuevoStock = [...materiaPrima];
    comandaActual.forEach(plato => {
      if (plato.receta && plato.receta.length > 0) {
        plato.receta.forEach(ing => {
          const idx = nuevoStock.findIndex(m => m.id === ing.insumoId);
          if (idx !== -1) {
            nuevoStock[idx].stock = Math.max(0, Number(nuevoStock[idx].stock) - (ing.cantidad * plato.cantidad));
          }
        });
      }
    });
    setMateriaPrima(nuevoStock);

    const nuevaFactura = {
      id: `FACT-${1000 + facturas.length + 1}`,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      cliente: clientData.nombre,
      doc: clientData.nit,
      tipo: payServiceType,
      mesa: selectedTable ? selectedTable.nombre : 'Directa',
      cajero: selectedTable?.mesero || `${currentUser.nombre} ${currentUser.apellidos}`,
      repartidor: payServiceType === 'domicilio' ? (domicilioData.repartidor || 'Sin Asignar') : null,
      metodo: payMethod,
      subtotal: subtotalComanda,
      impuesto: impoconsumoCalculado,
      propina: Number(propinaVoluntaria),
      domicilio: fleteDomicilio,
      total: totalPagar,
      vuelto: cambioEfectivo,
      items: comandaActual.map(p => ({ nombre: p.nombre, cantidad: p.cantidad, precio: p.precio }))
    };

    setFacturas([nuevaFactura, ...facturas]);

    if (selectedTable) {
      setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, estado: 'libre', comanda: [], mesero: null } : t));
    }

    try {
      await supabase.from('facturas').insert([nuevaFactura]);
    } catch(e) {}

    setIsPayModalOpen(false);
    setSelectedTable(null);
    setEfectivoRecibido('');
    setFacturaImprimir(nuevaFactura);
  };

  // ==========================================
  // PANTALLA: LOGIN
  // ==========================================
  if (!currentUser) {
    return (
      <div className="w-screen h-screen min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-orange-600" />
          <div className="text-center mb-8">
            <div className="w-28 h-28 bg-slate-950/80 border border-slate-800 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-orange-500/10 mb-4 overflow-hidden p-2">
              {logos.login ? (
                <img src={logos.login} alt="Logo Login" className="w-full h-full object-contain" />
              ) : (
                <UtensilsCrossed className="w-12 h-12 text-amber-500" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">{empresa.nombre}</h1>
            <p className="text-slate-400 text-sm mt-1">{empresa.eslogan}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="admin@gourmetpos.com"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">PIN / Contraseña</label>
              <input 
                type="password" 
                value={loginPin} 
                onChange={(e) => setLoginPin(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm tracking-widest focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••"
                required
              />
            </div>

            {loginError && (
              <p className="text-rose-500 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">{loginError}</p>
            )}

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold py-3.5 rounded-xl hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-orange-600/20"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <span className="text-xs text-slate-500 block mb-2">Accesos rápidos:</span>
            <div className="flex justify-center gap-2 text-xs">
              <button onClick={() => { setLoginEmail('admin@gourmetpos.com'); setLoginPin('1234'); }} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">Admin</button>
              <button onClick={() => { setLoginEmail('valeria@gourmetpos.com'); setLoginPin('2222'); }} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">Cajero</button>
              <button onClick={() => { setLoginEmail('mateo@gourmetpos.com'); setLoginPin('3333'); }} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">Mesero</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PANTALLA PRINCIPAL
  // ==========================================
  return (
    <div className="w-screen h-screen min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden m-0 p-0">
      
      {/* HEADER SUPERIOR */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden p-1 shadow-inner">
            {logos.app ? (
              <img src={logos.app} alt="Logo App" className="w-full h-full object-contain" />
            ) : (
              <UtensilsCrossed className="w-6 h-6 text-amber-500" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">{empresa.nombre}</h1>
            <span className="text-xs text-slate-400">NIT: {empresa.nit}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-950 border border-slate-800 px-4 py-1.5 rounded-xl flex items-center gap-3">
            <span className="text-xs text-slate-400">Caja Actual:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${cajaAbierta ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {cajaAbierta ? `ABIERTA (Base: $${Number(baseApertura).toLocaleString()})` : 'REQUIERE APERTURA'}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 px-4 py-1.5 rounded-xl flex items-center gap-3">
            <span className="text-xs text-slate-400">Facturado Turno:</span>
            <span className="text-sm font-bold text-emerald-400">
              ${facturas.reduce((acc, f) => acc + f.total, 0).toLocaleString()} COP
            </span>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
            <div className="text-right">
              <span className="text-xs font-semibold text-white block">{currentUser.nombre} {currentUser.apellidos}</span>
              <span className="text-[10px] text-amber-500 capitalize uppercase">{currentUser.bloque}</span>
            </div>
            <button 
              onClick={handleLogout} 
              title="Cerrar Sesión" 
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENEDOR CENTRAL */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* BARRA LATERAL */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
          <nav className="space-y-1">
            {currentUser.modulos.includes('mesas') && (
              <button 
                onClick={handleNavToMesas} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'mesas' ? 'bg-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Salón de Mesas</span>
              </button>
            )}

            {currentUser.modulos.includes('menu') && (
              <button 
                onClick={() => setActiveTab('menu')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'menu' ? 'bg-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Menú de Ventas</span>
              </button>
            )}

            {currentUser.modulos.includes('materia_prima') && (
              <button 
                onClick={() => setActiveTab('materia_prima')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'materia_prima' ? 'bg-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4" />
                  <span>Materia Prima</span>
                </div>
                {materiaPrimaCritica.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            )}

            {currentUser.modulos.includes('recetas') && (
              <button 
                onClick={() => setActiveTab('recetas')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'recetas' ? 'bg-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>RECETAS</span>
              </button>
            )}

            {currentUser.modulos.includes('compras') && (
              <button 
                onClick={() => setActiveTab('compras')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'compras' ? 'bg-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>COMPRAS</span>
              </button>
            )}

            {currentUser.modulos.includes('facturas') && (
              <button 
                onClick={() => setActiveTab('facturas')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'facturas' ? 'bg-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Historial Facturas</span>
              </button>
            )}

            {currentUser.modulos.includes('registro_cierres') && (
              <button 
                onClick={() => setActiveTab('registro_cierres')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'registro_cierres' ? 'bg-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <History className="w-4 h-4" />
                <span>Registro Cierres de Caja</span>
              </button>
            )}

            {currentUser.bloque === 'administrativo' && (
              <button 
                onClick={() => setActiveTab('solicitudes')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'solicitudes' ? 'bg-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4" />
                  <span>Bandeja Solicitudes</span>
                </div>
                {solicitudesPendientes.length > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                    {solicitudesPendientes.length}
                  </span>
                )}
              </button>
            )}

            {currentUser.modulos.includes('configuracion') && (
              <button 
                onClick={() => setActiveTab('configuracion')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'configuracion' ? 'bg-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <Settings className="w-4 h-4" />
                <span>Configuración</span>
              </button>
            )}
          </nav>

          {currentUser.modulos.includes('cierre') && (
            <div className="pt-4 border-t border-slate-800">
              <button 
                onClick={() => setIsCierreModalOpen(true)} 
                className="w-full bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-rose-600/20"
              >
                <DollarSign className="w-4 h-4" />
                <span>CIERRE DE CAJA</span>
              </button>
            </div>
          )}
        </aside>

        {/* ÁREA DE CONTENIDO */}
        <main className="flex-1 bg-slate-950 overflow-y-auto p-6 relative">

          {/* VISTA 1: SALÓN DE MESAS */}
          {activeTab === 'mesas' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Distribución del Restaurante</h2>
                  <p className="text-xs text-slate-400">Haz clic sobre cualquier mesa para abrir el menú completo y cargar pedidos</p>
                </div>

                {permisosDetalle['mesas.editar_plano']?.includes(currentUser.id) && (
                  <button 
                    onClick={() => setIsEditPlano(!isEditPlano)} 
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${isEditPlano ? 'bg-amber-500 text-white border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isEditPlano ? 'Terminar Edición de Plano' : 'Editar Plano (Mover Mesas)'}</span>
                  </button>
                )}
              </div>

              <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-auto min-h-[480px]">
                {tables.map(table => {
                  const isLibre = table.estado === 'libre';
                  const isOcupada = table.estado === 'ocupada';

                  return (
                    <div 
                      key={table.id}
                      onClick={() => !isEditPlano && setSelectedTable(table)}
                      style={{
                        position: 'absolute',
                        left: `${table.x}px`,
                        top: `${table.y}px`,
                        width: table.forma === 'rectangular' ? '150px' : '100px',
                        height: '100px'
                      }}
                      className={`cursor-pointer rounded-2xl p-3 flex flex-col items-center justify-between border-2 transition-all shadow-lg ${
                        isLibre ? 'bg-slate-900 border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/10' :
                        isOcupada ? 'bg-amber-500/10 border-amber-500 hover:border-amber-400 shadow-amber-500/10' :
                        'bg-blue-500/10 border-blue-500 hover:border-blue-400'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">{table.capacidad}p</span>
                        <span className={`w-2 h-2 rounded-full ${isLibre ? 'bg-emerald-400' : isOcupada ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>

                      <div className="text-center w-full">
                        <span className="text-xs font-bold text-white block truncate">{table.nombre}</span>
                        {isOcupada && (
                          <span className="text-[10px] text-amber-400 font-medium block truncate">
                            ${(Array.isArray(table.comanda) ? table.comanda : []).reduce((a, b) => a + (b.precio * b.cantidad), 0).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISTA 2: MENÚ DE VENTAS */}
          {activeTab === 'menu' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Menú de Platos</h2>
                  <p className="text-xs text-slate-400">Administración de platos creados</p>
                </div>
                <div className="flex gap-2">
                  {categoriasMenu.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategoriaMenu(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${selectedCategoriaMenu === cat ? 'bg-amber-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.filter(p => p.categoria === selectedCategoriaMenu).map(plato => (
                  <div key={plato.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-3xl">
                      {plato.imagen}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-white">{plato.nombre}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{plato.descripcion}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-bold text-amber-400">${plato.precio.toLocaleString()} COP</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">Imp: {plato.impuesto}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISTA 3: MATERIA PRIMA */}
          {activeTab === 'materia_prima' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto">
              {materiaPrimaCritica.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-rose-400 block">Stock Crítico Detectado</span>
                      <span className="text-xs text-slate-400">{materiaPrimaCritica.length} insumos por debajo del mínimo.</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Insumo</th>
                      <th className="p-3.5">Grupo</th>
                      <th className="p-3.5">Stock Actual</th>
                      <th className="p-3.5">Stock Mínimo</th>
                      <th className="p-3.5">Costo Unitario</th>
                      <th className="p-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {materiaPrima.map(item => {
                      const isBajo = Number(item.stock) <= Number(item.minimo);
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5 font-bold text-white">{item.nombre}</td>
                          <td className="p-3.5 text-slate-400">{item.grupo}</td>
                          <td className="p-3.5">
                            <span className={`font-bold ${isBajo ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {item.stock} {item.unidad}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400">{item.minimo} {item.unidad}</td>
                          <td className="p-3.5">${item.costo.toLocaleString()} COP</td>
                          <td className="p-3.5 text-right">
                            <button 
                              onClick={() => { setModalSolicitud(item); setCantSolicitar(String(item.minimo * 2)); }}
                              className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500 hover:text-white transition-all font-semibold"
                            >
                              Solicitar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA 4: RECETAS */}
          {activeTab === 'recetas' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">RECETAS</h2>
                  <p className="text-xs text-slate-400">Cree o edite los componentes de preparación para cada producto del menú</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {menuItems.map(plato => {
                  const tieneReceta = Array.isArray(plato.receta) && plato.receta.length > 0;
                  const costoReceta = (plato.receta || []).reduce((acc, ing) => {
                    const ins = materiaPrima.find(m => m.id === ing.insumoId);
                    return acc + (ins ? ins.costo * ing.cantidad : 0);
                  }, 0);

                  return (
                    <div key={plato.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-lg">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{plato.imagen}</span>
                            <div>
                              <h3 className="font-bold text-sm text-white">{plato.nombre}</h3>
                              <span className="text-xs text-amber-400 font-semibold">${plato.precio.toLocaleString()} COP</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setModalReceta(plato);
                              setTempReceta(Array.isArray(plato.receta) ? [...plato.receta] : []);
                              setNuevoInsumoReceta({ insumoId: '', cantidad: '' });
                            }}
                            className="p-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white rounded-xl transition-all"
                            title={tieneReceta ? 'Editar Receta' : 'Crear Receta'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-1.5 min-h-[90px]">
                          {!tieneReceta ? (
                            <p className="text-xs text-slate-500 py-4 text-center">Sin receta configurada</p>
                          ) : (
                            plato.receta.map((ing, idx) => {
                              const targetInsumo = materiaPrima.find(m => m.id === ing.insumoId);
                              return (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span className="text-slate-300 truncate max-w-[170px]">• {targetInsumo ? targetInsumo.nombre : 'Insumo'}</span>
                                  <span className="text-amber-400 font-medium">{ing.cantidad} {targetInsumo ? targetInsumo.unidad : ''}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Costo Materia Prima:</span>
                        <span className="font-bold text-emerald-400">${Math.round(costoReceta).toLocaleString()} COP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISTA 5: COMPRAS */}
          {activeTab === 'compras' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">COMPRAS</h2>
                  <p className="text-xs text-slate-400">Cargue facturas con múltiples ítems y actualice el inventario en lote</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-800 text-xs">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1.5">Proveedor *</label>
                    <input 
                      type="text" 
                      value={compraHeader.proveedor} 
                      onChange={e => setCompraHeader({ ...compraHeader, proveedor: e.target.value })}
                      placeholder="ej: Distribuidora Avícola / Carnes del Llano" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1.5">Número de Factura / Remisión *</label>
                    <input 
                      type="text" 
                      value={compraHeader.factura} 
                      onChange={e => setCompraHeader({ ...compraHeader, factura: e.target.value })}
                      placeholder="ej: FAC-8930" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1.5">Fecha de Ingreso</label>
                    <input 
                      type="date" 
                      value={compraHeader.fecha} 
                      onChange={e => setCompraHeader({ ...compraHeader, fecha: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Productos de la Factura:</span>
                    <button
                      type="button"
                      onClick={() => setCompraItems([...compraItems, { insumoId: '', marca: '', cantidad: '', costoUnitario: '', caducidad: '' }])}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Anexar Otro Ítem</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {compraItems.map((item, index) => {
                      const subtotalFila = (Number(item.cantidad) || 0) * (Number(item.costoUnitario) || 0);

                      return (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 items-center text-xs">
                          <div className="md:col-span-4">
                            <label className="text-[10px] text-slate-500 font-semibold block md:hidden mb-1">Insumo</label>
                            <select
                              value={item.insumoId}
                              onChange={e => {
                                const up = [...compraItems];
                                up[index].insumoId = e.target.value;
                                setCompraItems(up);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none"
                            >
                              <option value="">Seleccione insumo...</option>
                              {materiaPrima.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre} ({m.unidad})</option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-[10px] text-slate-500 font-semibold block md:hidden mb-1">Marca / Lote</label>
                            <input 
                              type="text"
                              value={item.marca}
                              onChange={e => {
                                const up = [...compraItems];
                                up[index].marca = e.target.value;
                                setCompraItems(up);
                              }}
                              placeholder="Marca / Lote"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-[10px] text-slate-500 font-semibold block md:hidden mb-1">Cantidad</label>
                            <input 
                              type="number"
                              value={item.cantidad}
                              onChange={e => {
                                const up = [...compraItems];
                                up[index].cantidad = e.target.value;
                                setCompraItems(up);
                              }}
                              placeholder="Cant."
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none text-right font-bold"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-[10px] text-slate-500 font-semibold block md:hidden mb-1">Costo Unit.</label>
                            <input 
                              type="number"
                              value={item.costoUnitario}
                              onChange={e => {
                                const up = [...compraItems];
                                up[index].costoUnitario = e.target.value;
                                setCompraItems(up);
                              }}
                              placeholder="Costo Unit."
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none text-right font-bold"
                            />
                          </div>

                          <div className="md:col-span-1 text-right font-bold text-emerald-400">
                            ${subtotalFila.toLocaleString()}
                          </div>

                          <div className="md:col-span-1 flex justify-center">
                            <button
                              type="button"
                              disabled={compraItems.length === 1}
                              onClick={() => setCompraItems(compraItems.filter((_, idx) => idx !== index))}
                              className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm">
                    <span className="text-slate-400">Total Factura de Compra: </span>
                    <span className="text-xl font-extrabold text-emerald-400">
                      ${compraItems.reduce((acc, it) => acc + ((Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0)), 0).toLocaleString()} COP
                    </span>
                  </div>

                  <button 
                    onClick={() => {
                      if (!compraHeader.proveedor || !compraHeader.factura) {
                        alert('Diligencie el proveedor y número de factura.');
                        return;
                      }
                      const itemsValidos = compraItems.filter(it => it.insumoId && Number(it.cantidad) > 0 && Number(it.costoUnitario) > 0);
                      if (itemsValidos.length === 0) {
                        alert('Agregue al menos un producto válido a la compra.');
                        return;
                      }

                      const nuevoStock = [...materiaPrima];
                      const nuevosRegistros = [];

                      itemsValidos.forEach((item, idx) => {
                        const insIndex = nuevoStock.findIndex(m => m.id === item.insumoId);
                        const cantNum = Number(item.cantidad);
                        const costoNum = Number(item.costoUnitario);

                        if (insIndex !== -1) {
                          nuevoStock[insIndex].stock = Number(nuevoStock[insIndex].stock) + cantNum;
                          nuevoStock[insIndex].costo = costoNum;
                        }

                        const targetInsumo = materiaPrima.find(m => m.id === item.insumoId);

                        nuevosRegistros.push({
                          id: `CMP-${Date.now()}-${idx}`,
                          proveedor: compraHeader.proveedor,
                          factura: compraHeader.factura,
                          fecha: compraHeader.fecha,
                          insumoNombre: targetInsumo ? targetInsumo.nombre : 'Insumo',
                          marca: item.marca || 'Genérica',
                          cantidad: cantNum,
                          costoUnitario: costoNum,
                          total: cantNum * costoNum,
                          fechaCaducidad: item.caducidad || '2027-12-31',
                          responsable: `${currentUser.nombre} ${currentUser.apellidos}`
                        });
                      });

                      setMateriaPrima(nuevoStock);
                      setComprasHistorial([...nuevosRegistros, ...comprasHistorial]);
                      setCompraHeader({ proveedor: '', factura: '', fecha: new Date().toISOString().substring(0, 10) });
                      setCompraItems([{ insumoId: '', marca: '', cantidad: '', costoUnitario: '', caducidad: '' }]);
                      alert('Factura de compras procesada. El inventario ha sido actualizado.');
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar y Cargar al Inventario</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 6: HISTORIAL FACTURAS */}
          {activeTab === 'facturas' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto">
              <h2 className="text-lg font-bold text-white">Historial de Facturación & Búsqueda</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    value={filtroFacturaCliente} 
                    onChange={e => setFiltroFacturaCliente(e.target.value)} 
                    placeholder="Buscar por cliente o NIT..." 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="date" 
                    value={filtroFacturaFecha} 
                    onChange={e => setFiltroFacturaFecha(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="relative">
                  <UtensilsCrossed className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    value={filtroFacturaProducto} 
                    onChange={e => setFiltroFacturaProducto(e.target.value)} 
                    placeholder="Filtrar por plato vendido..." 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Factura</th>
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Cliente</th>
                      <th className="p-3.5">Atendido por</th>
                      <th className="p-3.5">Método</th>
                      <th className="p-3.5">Total</th>
                      <th className="p-3.5 text-right">Tirilla</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {facturas.filter(f => {
                      const cCli = filtroFacturaCliente === '' || f.cliente.toLowerCase().includes(filtroFacturaCliente.toLowerCase()) || f.doc.includes(filtroFacturaCliente);
                      const cFec = filtroFacturaFecha === '' || f.fecha.startsWith(filtroFacturaFecha);
                      const cPro = filtroFacturaProducto === '' || f.items.some(it => it.nombre.toLowerCase().includes(filtroFacturaProducto.toLowerCase()));
                      return cCli && cFec && cPro;
                    }).map(f => (
                      <tr key={f.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-amber-400">{f.id}</td>
                        <td className="p-3.5 text-slate-400">{f.fecha}</td>
                        <td className="p-3.5 font-medium text-white">{f.cliente}</td>
                        <td className="p-3.5 text-slate-400">{f.cajero}</td>
                        <td className="p-3.5 capitalize">{f.metodo}</td>
                        <td className="p-3.5 font-bold text-emerald-400">${f.total.toLocaleString()} COP</td>
                        <td className="p-3.5 text-right">
                          <button 
                            onClick={() => setFacturaImprimir(f)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA 7: REGISTRO CIERRES DE CAJA (HISTÓRICO Y REIMPRESIÓN) */}
          {activeTab === 'registro_cierres' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">Registro Cierres de Caja</h2>
                  <p className="text-xs text-slate-400">Historial permanente de cierres de turno y jornada con soporte de reimpresión</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">ID Cierre</th>
                      <th className="p-3.5">Fecha y Hora</th>
                      <th className="p-3.5">Tipo</th>
                      <th className="p-3.5">Responsable</th>
                      <th className="p-3.5">Base Inicial</th>
                      <th className="p-3.5">Ventas Totales</th>
                      <th className="p-3.5">Efectivo Físico</th>
                      <th className="p-3.5">Balance</th>
                      <th className="p-3.5 text-right">Reimprimir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {historialCierres.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-8 text-center text-slate-500">
                          No se han registrado cierres de caja todavía.
                        </td>
                      </tr>
                    ) : (
                      historialCierres.map(cierre => (
                        <tr key={cierre.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5 font-bold text-amber-400">{cierre.id}</td>
                          <td className="p-3.5 text-slate-400">{cierre.fecha}</td>
                          <td className="p-3.5 capitalize font-semibold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${cierre.tipo.includes('jornada') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {cierre.tipo}
                            </span>
                          </td>
                          <td className="p-3.5 font-medium text-white">{cierre.responsable}</td>
                          <td className="p-3.5">${cierre.baseApertura.toLocaleString()}</td>
                          <td className="p-3.5 font-bold text-emerald-400">${cierre.totalVentas.toLocaleString()}</td>
                          <td className="p-3.5 font-bold text-white">${cierre.efectivoContado.toLocaleString()}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cierre.diferencia === 0 ? 'bg-emerald-500/10 text-emerald-400' :
                              cierre.diferencia > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {cierre.balanceTexto}: ${Math.abs(cierre.diferencia).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button 
                              onClick={() => {
                                setCierreActivoParaImprimir(cierre);
                                setSubModalReportesOpen(true);
                              }}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white rounded-xl transition-all text-xs font-bold inline-flex items-center gap-1.5 border border-amber-500/20"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Imprimir</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA 8: SOLICITUDES ADMIN */}
          {activeTab === 'solicitudes' && currentUser.bloque === 'administrativo' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto">
              <h2 className="text-lg font-bold text-white">Solicitudes de Insumos</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">Insumo</th>
                      <th className="p-3.5">Cantidad Pedida</th>
                      <th className="p-3.5">Solicitante</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {solicitudesStock.map(sol => (
                      <tr key={sol.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-amber-400">{sol.id}</td>
                        <td className="p-3.5 font-semibold text-white">{sol.insumoNombre}</td>
                        <td className="p-3.5 font-bold">{sol.cantidadSolicitada} {sol.unidad}</td>
                        <td className="p-3.5 text-slate-400">{sol.solicitante}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sol.estado === 'pendiente' ? 'bg-amber-500/10 text-amber-400' :
                            sol.estado === 'aprobada' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {sol.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {sol.estado === 'pendiente' && (
                            <button 
                              onClick={() => setSolicitudesStock(solicitudesStock.map(s => s.id === sol.id ? { ...s, estado: 'aprobada' } : s))}
                              className="px-2.5 py-1 bg-amber-500 text-white rounded-lg font-bold text-[10px]"
                            >
                              Aprobar
                            </button>
                          )}
                          {sol.estado !== 'comprada' && (
                            <button 
                              onClick={() => setSolicitudesStock(solicitudesStock.map(s => s.id === sol.id ? { ...s, estado: 'comprada' } : s))}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]"
                            >
                              Comprada
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA 9: CONFIGURACIÓN */}
          {activeTab === 'configuracion' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">Configuración del Sistema</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Gestione datos de la empresa, logos locales, perfiles editables y matriz de permisos</p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
                  <button
                    onClick={() => setConfigSubTab('informacion')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      configSubTab === 'informacion' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>INFORMACIÓN</span>
                  </button>

                  <button
                    onClick={() => setConfigSubTab('logo')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      configSubTab === 'logo' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>LOGO</span>
                  </button>

                  <button
                    onClick={() => setConfigSubTab('usuarios')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      configSubTab === 'usuarios' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>USUARIOS</span>
                  </button>

                  <button
                    onClick={() => setConfigSubTab('permisos')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      configSubTab === 'permisos' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>PERMISOS</span>
                  </button>
                </div>
              </div>

              {/* INFORMACIÓN */}
              {configSubTab === 'informacion' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Datos Generales del Establecimiento
                    </span>
                    <button 
                      onClick={() => alert('Información actualizada exitosamente')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                    >
                      Guardar Cambios
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1.5">Nombre Comercial</label>
                      <input 
                        type="text" 
                        value={empresa.nombre} 
                        onChange={e => setEmpresa({ ...empresa, nombre: e.target.value })} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" 
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold block mb-1.5">NIT</label>
                      <input 
                        type="text" 
                        value={empresa.nit} 
                        onChange={e => setEmpresa({ ...empresa, nit: e.target.value })} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" 
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold block mb-1.5">Teléfono / Celular</label>
                      <input 
                        type="text" 
                        value={empresa.telefono} 
                        onChange={e => setEmpresa({ ...empresa, telefono: e.target.value })} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" 
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold block mb-1.5">Correo Electrónico</label>
                      <input 
                        type="email" 
                        value={empresa.correo} 
                        onChange={e => setEmpresa({ ...empresa, correo: e.target.value })} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" 
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold block mb-1.5">Dirección Física</label>
                      <input 
                        type="text" 
                        value={empresa.direccion} 
                        onChange={e => setEmpresa({ ...empresa, direccion: e.target.value })} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" 
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold block mb-1.5">Representante Legal</label>
                      <input 
                        type="text" 
                        value={empresa.representante_legal} 
                        onChange={e => setEmpresa({ ...empresa, representante_legal: e.target.value })} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" 
                      />
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="text-slate-400 font-semibold block mb-1.5">Eslogan</label>
                      <input 
                        type="text" 
                        value={empresa.eslogan} 
                        onChange={e => setEmpresa({ ...empresa, eslogan: e.target.value })} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LOGO */}
              {configSubTab === 'logo' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
                  <div className="pb-3 border-b border-slate-800">
                    <span className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Carga de Logotipos desde Archivos de tu Equipo
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Soporte directo para imágenes PNG sin fondo, SVG y WEBP</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between text-center space-y-4">
                      <div>
                        <h4 className="font-bold text-xs text-white">Logo de la App (Header)</h4>
                        <p className="text-[11px] text-slate-400 mt-1">Barra superior del sistema</p>
                      </div>

                      <div className="w-28 h-28 bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden p-2">
                        {logos.app ? (
                          <img src={logos.app} alt="App" className="w-full h-full object-contain" />
                        ) : (
                          <UtensilsCrossed className="w-10 h-10 text-slate-600" />
                        )}
                      </div>

                      <label className="w-full cursor-pointer px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Archivo (PNG)</span>
                        <input 
                          type="file" 
                          accept="image/png, image/svg+xml, image/webp, image/jpeg" 
                          className="hidden" 
                          onChange={e => handleLocalImageUpload(e, base64 => setLogos({ ...logos, app: base64 }))} 
                        />
                      </label>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between text-center space-y-4">
                      <div>
                        <h4 className="font-bold text-xs text-white">Logo Pantalla de Login</h4>
                        <p className="text-[11px] text-slate-400 mt-1">Inicio de sesión general</p>
                      </div>

                      <div className="w-28 h-28 bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden p-2">
                        {logos.login ? (
                          <img src={logos.login} alt="Login" className="w-full h-full object-contain" />
                        ) : (
                          <Lock className="w-10 h-10 text-slate-600" />
                        )}
                      </div>

                      <label className="w-full cursor-pointer px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Archivo (PNG)</span>
                        <input 
                          type="file" 
                          accept="image/png, image/svg+xml, image/webp, image/jpeg" 
                          className="hidden" 
                          onChange={e => handleLocalImageUpload(e, base64 => setLogos({ ...logos, login: base64 }))} 
                        />
                      </label>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between text-center space-y-4">
                      <div>
                        <h4 className="font-bold text-xs text-white">Logo Facturación POS</h4>
                        <p className="text-[11px] text-slate-400 mt-1">Encabezado de tirilla térmica</p>
                      </div>

                      <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-slate-300 p-2">
                        {logos.pos ? (
                          <img src={logos.pos} alt="POS" className="w-full h-full object-contain grayscale" />
                        ) : (
                          <Printer className="w-10 h-10 text-slate-800" />
                        )}
                      </div>

                      <label className="w-full cursor-pointer px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Archivo (PNG)</span>
                        <input 
                          type="file" 
                          accept="image/png, image/svg+xml, image/webp, image/jpeg" 
                          className="hidden" 
                          onChange={e => handleLocalImageUpload(e, base64 => setLogos({ ...logos, pos: base64 }))} 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* USUARIOS */}
              {configSubTab === 'usuarios' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Personal por Bloques Operativos
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">Edite o cree usuarios con foto y configure módulos</p>
                    </div>

                    <button 
                      onClick={() => {
                        setEditingUserId(null);
                        setUserFormData({
                          nombre: '', apellidos: '', cedula: '', telefono: '', email: '', pin: '',
                          bloque: 'meseros', fechaIngreso: new Date().toISOString().substring(0, 10), foto: '',
                          emergenciaNombre: '', emergenciaTelefono: '', modulos: ['mesas']
                        });
                        setModalUsuario(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Crear Nuevo Usuario</span>
                    </button>
                  </div>

                  {['administrativo', 'cajeros', 'meseros', 'cocina'].map(bloqueKey => {
                    const usuariosEnBloque = usuarios.filter(u => u.bloque === bloqueKey);

                    return (
                      <div key={bloqueKey} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-md">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                              Bloque: {bloqueKey}
                            </h3>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 font-semibold border border-slate-800">
                              {usuariosEnBloque.length} usuarios
                            </span>
                          </div>
                        </div>

                        {usuariosEnBloque.length === 0 ? (
                          <p className="text-xs text-slate-500 py-3 text-center">No hay personal registrado en este bloque.</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {usuariosEnBloque.map(user => (
                              <div key={user.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-amber-400 overflow-hidden text-sm">
                                    {user.foto ? (
                                      <img src={user.foto} alt={user.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{user.nombre.charAt(0)}{user.apellidos.charAt(0)}</span>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-xs text-white flex items-center gap-2">
                                      {user.nombre} {user.apellidos}
                                      <span className="text-[10px] text-slate-400 font-normal">CC: {user.cedula}</span>
                                    </h4>
                                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                      <span>📧 {user.email}</span>
                                      <span>📞 {user.telefono}</span>
                                      <span>📅 Ingreso: {user.fechaIngreso}</span>
                                    </div>
                                    <div className="text-[10px] text-amber-500 mt-1">
                                      🚨 Emergencia: {user.contactoEmergencia?.nombre} ({user.contactoEmergencia?.telefono})
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                                  <div className="flex flex-wrap gap-1">
                                    {['mesas', 'menu', 'materia_prima', 'recetas', 'compras', 'facturas', 'cierre', 'registro_cierres', 'configuracion', 'solicitudes'].map(mod => {
                                      const tieneModulo = user.modulos.includes(mod);
                                      return (
                                        <button
                                          key={mod}
                                          disabled={currentUser.bloque !== 'administrativo'}
                                          onClick={() => {
                                            const nuevos = tieneModulo ? user.modulos.filter(m => m !== mod) : [...user.modulos, mod];
                                            setUsuarios(usuarios.map(u => u.id === user.id ? { ...u, modulos: nuevos } : u));
                                          }}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                                            tieneModulo 
                                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                              : 'bg-slate-900 text-slate-600 border border-slate-800'
                                          }`}
                                        >
                                          {mod}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <button
                                    onClick={() => {
                                      setEditingUserId(user.id);
                                      setUserFormData({
                                        nombre: user.nombre,
                                        apellidos: user.apellidos,
                                        cedula: user.cedula,
                                        telefono: user.telefono,
                                        email: user.email,
                                        pin: user.pin,
                                        bloque: user.bloque,
                                        fechaIngreso: user.fechaIngreso,
                                        foto: user.foto || '',
                                        emergenciaNombre: user.contactoEmergencia?.nombre || '',
                                        emergenciaTelefono: user.contactoEmergencia?.telefono || '',
                                        modulos: user.modulos || ['mesas']
                                      });
                                      setModalUsuario(true);
                                    }}
                                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-amber-500/20"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PERMISOS */}
              {configSubTab === 'permisos' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                  <div className="pb-3 border-b border-slate-800">
                    <span className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Matriz de Permisos Específicos por Módulo
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Conceda o revoque privilegios críticos a cualquier usuario</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Módulo & Acción Permitida</th>
                          {usuarios.map(u => (
                            <th key={u.id} className="p-3.5 text-center">
                              <span className="text-white block">{u.nombre}</span>
                              <span className="text-[10px] text-amber-500 font-normal capitalize">({u.bloque})</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {[
                          { key: 'mesas.reabrir', label: 'Reabrir Mesas ya Cobradas', mod: 'Mesas' },
                          { key: 'mesas.editar_plano', label: 'Mover y Editar Plano del Salón', mod: 'Mesas' },
                          { key: 'facturas.anular', label: 'Anular Facturas Emitidas', mod: 'Facturación' },
                          { key: 'facturas.cortesia', label: 'Autorizar Cortesías / Invitados por la Casa', mod: 'Facturación' },
                          { key: 'menu.cambiar_precios', label: 'Modificar Precios de Venta del Menú', mod: 'Menú' },
                          { key: 'materia_prima.crear_insumos', label: 'Crear Nuevos Insumos en Almacén', mod: 'Materia Prima' },
                          { key: 'materia_prima.aprobar_solicitud', label: 'Aprobar Solicitudes de Insumos', mod: 'Materia Prima' },
                          { key: 'cierre.auditoria_ciega', label: 'Ver Efectivo Esperado antes del Arqueo', mod: 'Cierre de Caja' }
                        ].map(perm => (
                          <tr key={perm.key} className="hover:bg-slate-800/40">
                            <td className="p-3.5">
                              <span className="font-bold text-white block">{perm.label}</span>
                              <span className="text-[10px] text-slate-400">Módulo: {perm.mod}</span>
                            </td>
                            {usuarios.map(u => {
                              const activo = permisosDetalle[perm.key]?.includes(u.id);
                              return (
                                <td key={u.id} className="p-3.5 text-center">
                                  <button
                                    onClick={() => {
                                      const actuales = permisosDetalle[perm.key] || [];
                                      const yaTiene = actuales.includes(u.id);
                                      setPermisosDetalle({
                                        ...permisosDetalle,
                                        [perm.key]: yaTiene ? actuales.filter(id => id !== u.id) : [...actuales, u.id]
                                      });
                                    }}
                                    className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs transition-all ${
                                      activo 
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                        : 'bg-slate-950 text-slate-600 border border-slate-800'
                                    }`}
                                  >
                                    {activo ? '✓' : '✕'}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL: APERTURA OBLIGATORIA AL ABRIR SALÓN DE MESAS      */}
      {/* ======================================================== */}
      {modalAperturaOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <DollarSign className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-white text-base">Apertura de Caja Requerida</h3>
              <p className="text-xs text-slate-400">
                La caja se encuentra cerrada o finalizada. Para habilitar el salón de mesas y comenzar a tomar pedidos, ingrese la base en efectivo con la que inicia.
              </p>
            </div>

            <form onSubmit={handleConfirmarApertura} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Monto Base de Apertura ($ COP) *</label>
                <input 
                  type="number"
                  min="0"
                  value={baseApertura || ''}
                  onChange={e => setBaseApertura(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ej: 150000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-base font-extrabold text-right focus:border-amber-500 outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalAperturaOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-all text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Habilitar Salón</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ARQUEO Y CIERRE DE CAJA                           */}
      {/* ======================================================== */}
      {isCierreModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Arqueo y Cierre de Caja</h3>
              <button onClick={() => setIsCierreModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Tipo de Cierre */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">Seleccione el Tipo de Cierre:</label>
              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTipoCierreSeleccionado('turno')}
                  className={`py-3 rounded-2xl border transition-all ${
                    tipoCierreSeleccionado === 'turno' 
                      ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20' 
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Cierre de Turno (Parcial)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoCierreSeleccionado('jornada')}
                  className={`py-3 rounded-2xl border transition-all ${
                    tipoCierreSeleccionado === 'jornada' 
                      ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/20' 
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Cierre de Jornada Completa (Día)
                </button>
              </div>
            </div>

            {/* Conteo de Billetes y Monedas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {[
                { label: '$100.000', key: 'b100k' },
                { label: '$50.000', key: 'b50k' },
                { label: '$20.000', key: 'b20k' },
                { label: '$10.000', key: 'b10k' },
                { label: '$5.000', key: 'b5k' },
                { label: '$2.000', key: 'b2k' },
                { label: '$1.000 (Moneda)', key: 'm1000' },
                { label: '$500 (Moneda)', key: 'm500' }
              ].map(denom => (
                <div key={denom.key} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">{denom.label}</span>
                  <input 
                    type="number" 
                    min="0"
                    value={denominaciones[denom.key] || ''} 
                    onChange={e => setDenominaciones({ ...denominaciones, [denom.key]: Number(e.target.value) || 0 })} 
                    placeholder="0" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs text-right font-bold"
                  />
                </div>
              ))}
            </div>

            {/* Resumen Financiero del Turno */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Base Apertura:</span>
                <span className="text-white">${Number(baseApertura).toLocaleString()} COP</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Ventas en Efectivo:</span>
                <span className="text-white">${ventasEfectivo.toLocaleString()} COP</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Ventas por Transferencia:</span>
                <span className="text-blue-400 font-semibold">${ventasTransferencia.toLocaleString()} COP</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Propinas Recogidas:</span>
                <span className="text-amber-400 font-semibold">${totalPropinasRecogidas.toLocaleString()} COP</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fletes Domicilios Recaudados:</span>
                <span className="text-white">${totalDomiciliosRecaudados.toLocaleString()} COP</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                <span className="text-white">Efectivo Físico Contado:</span>
                <span className="text-emerald-400 font-extrabold">${totalFisicoContado.toLocaleString()} COP</span>
              </div>

              <div className="flex justify-between font-bold text-sm">
                <span className="text-white">Efectivo Esperado:</span>
                <span className="text-white font-extrabold">${totalEfectivoEsperado.toLocaleString()} COP</span>
              </div>

              <div className={`p-3 rounded-xl font-bold flex justify-between text-sm ${
                diferenciaArqueo === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                diferenciaArqueo > 0 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <span>{diferenciaArqueo === 0 ? 'Cuadre Exacto' : diferenciaArqueo > 0 ? 'Sobrante en Caja' : 'Faltante en Caja'}:</span>
                <span>${Math.abs(diferenciaArqueo).toLocaleString()} COP</span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsCierreModalOpen(false)} 
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-xs font-bold transition-all"
              >
                Cerrar
              </button>
              <button 
                onClick={handleGuardarCierrePOS} 
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Confirmar y Guardar Cierre POS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBMENÚ: OPCIONES DE IMPRESIÓN Y VISUALIZACIÓN           */}
      {/* ======================================================== */}
      {subModalReportesOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Opciones de Impresión de Cierre</h3>
                <p className="text-xs text-slate-400">Seleccione el reporte que desea generar para este cierre</p>
              </div>
              <button onClick={() => setSubModalReportesOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => { setReporteCierreTipo('pos'); setSubModalReportesOpen(false); }}
                className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <Printer className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">Impresión POS (Cierre Z General)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tirilla completa con ingresos, ventas, egresos, propinas, cuadre físico y balance.</p>
                </div>
              </button>

              <button
                onClick={() => { setReporteCierreTipo('mesero'); setSubModalReportesOpen(false); }}
                className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 text-left transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">Venta por Mesero</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Desglose de pedidos, total vendido y propinas recaudadas por cada mesero.</p>
                </div>
              </button>

              <button
                onClick={() => { setReporteCierreTipo('servicio'); setSubModalReportesOpen(false); }}
                className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 text-left transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">Pago por Servicio (Propinas)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ingreso neto recaudado exclusivamente por concepto de propinas voluntarias.</p>
                </div>
              </button>

              <button
                onClick={() => { setReporteCierreTipo('domicilios'); setSubModalReportesOpen(false); }}
                className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 text-left transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <Package className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors">Costos de Domicilios</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Liquidación de envíos desglosada por cada repartidor y total a pagar por fletes.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA PREVIA: TIRILLAS TÉRMICAS DE CIERRE DE CAJA        */}
      {/* ======================================================== */}
      {reporteCierreTipo && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full font-mono text-[11px] shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-1">
              {logos.pos && (
                <div className="w-16 h-16 mx-auto mb-1 flex items-center justify-center overflow-hidden">
                  <img src={logos.pos} alt="POS Logo" className="w-full h-full object-contain grayscale" />
                </div>
              )}
              <h4 className="font-extrabold text-sm">{empresa.nombre}</h4>
              <p>NIT: {empresa.nit}</p>
              <p>{empresa.direccion}</p>
              <p>Tel: {empresa.telefono}</p>
              <p className="text-[10px] text-slate-600">Fecha/Hora: {cierreActivoParaImprimir ? cierreActivoParaImprimir.fecha : new Date().toISOString().replace('T', ' ').substring(0, 16)}</p>
              <p className="text-[10px] text-slate-600">Auditor: {cierreActivoParaImprimir ? cierreActivoParaImprimir.responsable : `${currentUser.nombre} ${currentUser.apellidos}`}</p>
              <p className="text-[10px] text-slate-600 uppercase font-bold">Tipo: {cierreActivoParaImprimir ? cierreActivoParaImprimir.tipo : tipoCierreSeleccionado}</p>
            </div>

            {/* 1. TIRILLA CIERRE POS GENERAL */}
            {reporteCierreTipo === 'pos' && (
              <div className="space-y-2 border-t border-b border-dashed border-slate-300 py-3">
                <div className="text-center font-bold text-xs pb-1 border-b border-slate-200">
                  REPORTE DE CIERRE DE CAJA (Z)
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>Base de Apertura:</span>
                    <span>${(cierreActivoParaImprimir?.baseApertura ?? baseApertura).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ventas en Efectivo:</span>
                    <span>${(cierreActivoParaImprimir?.ventasEfectivo ?? ventasEfectivo).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ventas Transferencias:</span>
                    <span>${(cierreActivoParaImprimir?.ventasTransferencia ?? ventasTransferencia).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Propinas Recaudadas:</span>
                    <span>${(cierreActivoParaImprimir?.totalPropinas ?? totalPropinasRecogidas).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recaudo Domicilios:</span>
                    <span>${(cierreActivoParaImprimir?.totalDomicilios ?? totalDomiciliosRecaudados).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                    <span>VENTAS TOTALES:</span>
                    <span>${((cierreActivoParaImprimir?.ventasEfectivo ?? ventasEfectivo) + (cierreActivoParaImprimir?.ventasTransferencia ?? ventasTransferencia)).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 font-bold">
                  <div className="flex justify-between">
                    <span>EFECTIVO ESPERADO:</span>
                    <span>${(cierreActivoParaImprimir?.efectivoEsperado ?? totalEfectivoEsperado).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EFECTIVO CONTADO:</span>
                    <span>${(cierreActivoParaImprimir?.efectivoContado ?? totalFisicoContado).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-slate-300">
                    <span>{cierreActivoParaImprimir ? cierreActivoParaImprimir.balanceTexto : (diferenciaArqueo === 0 ? 'BALANCE:' : diferenciaArqueo > 0 ? 'SOBRANTE:' : 'FALTANTE:')}</span>
                    <span>${Math.abs(cierreActivoParaImprimir?.diferencia ?? diferenciaArqueo).toLocaleString()} COP</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. REPORTE VENTA POR MESERO */}
            {reporteCierreTipo === 'mesero' && (
              <div className="space-y-2 border-t border-b border-dashed border-slate-300 py-3">
                <div className="text-center font-bold text-xs pb-1 border-b border-slate-200">
                  REPORTE DE VENTAS POR MESERO
                </div>

                {(() => {
                  const meserosLista = Array.from(new Set(facturas.map(f => f.cajero || 'General')));
                  
                  return (
                    <div className="space-y-3 pt-1">
                      {meserosLista.map((meseroNombre, idx) => {
                        const facturasMesero = facturas.filter(f => (f.cajero || 'General') === meseroNombre);
                        const totalVentasM = facturasMesero.reduce((acc, f) => acc + f.total, 0);
                        const totalPropinasM = facturasMesero.reduce((acc, f) => acc + (Number(f.propina) || 0), 0);

                        return (
                          <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                            <div className="font-bold flex justify-between text-[11px] text-slate-900 border-b border-slate-200 pb-0.5">
                              <span>👤 {meseroNombre}</span>
                              <span>{facturasMesero.length} Pedidos</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span>Ventas Totales:</span>
                              <span className="font-semibold">${totalVentasM.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span>Propinas Generadas:</span>
                              <span className="font-semibold text-amber-700">${totalPropinasM.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold">
                  <span>TOTAL FACTURADO:</span>
                  <span>${facturas.reduce((acc, f) => acc + f.total, 0).toLocaleString()} COP</span>
                </div>
              </div>
            )}

            {/* 3. REPORTE PAGO POR SERVICIO */}
            {reporteCierreTipo === 'servicio' && (
              <div className="space-y-2 border-t border-b border-dashed border-slate-300 py-3">
                <div className="text-center font-bold text-xs pb-1 border-b border-slate-200">
                  REPORTE DE INGRESO NETO POR SERVICIO
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Total Propinas Voluntarias:</span>
                    <span className="font-bold">${(cierreActivoParaImprimir?.totalPropinas ?? totalPropinasRecogidas).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-300 flex justify-between text-xs font-extrabold">
                    <span>TOTAL SERVICIO RECAUDADO:</span>
                    <span>${(cierreActivoParaImprimir?.totalPropinas ?? totalPropinasRecogidas).toLocaleString()} COP</span>
                  </div>
                </div>

                <p className="text-[9px] text-slate-500 pt-1 text-center">
                  Valores correspondientes exclusivamente a propinas voluntarias del personal.
                </p>
              </div>
            )}

            {/* 4. REPORTE COSTOS DE DOMICILIOS */}
            {reporteCierreTipo === 'domicilios' && (
              <div className="space-y-2 border-t border-b border-dashed border-slate-300 py-3">
                <div className="text-center font-bold text-xs pb-1 border-b border-slate-200">
                  REPORTE DE COSTOS DE DOMICILIOS
                </div>

                {(() => {
                  const facturasDomicilio = facturas.filter(f => f.tipo === 'domicilio' && (Number(f.domicilio) || 0) > 0);
                  const repartidores = Array.from(new Set(facturasDomicilio.map(f => f.repartidor || 'Sin Asignar')));

                  if (repartidores.length === 0) {
                    return (
                      <p className="text-center text-slate-500 py-3 text-[10px]">
                        No se registraron entregas a domicilio en este turno.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2.5 pt-1">
                      {repartidores.map((rep, idx) => {
                        const enviosRep = facturasDomicilio.filter(f => (f.repartidor || 'Sin Asignar') === rep);
                        const totalFletesRep = enviosRep.reduce((acc, f) => acc + (Number(f.domicilio) || 0), 0);

                        return (
                          <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                            <div className="font-bold flex justify-between text-[11px] text-slate-900 border-b border-slate-200 pb-0.5">
                              <span>🛵 {rep}</span>
                              <span>{enviosRep.length} Envíos</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span>Total Fletes a Pagar:</span>
                              <span className="font-bold text-emerald-700">${totalFletesRep.toLocaleString()} COP</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-extrabold text-xs">
                  <span>TOTAL FLETES DOMICILIOS:</span>
                  <span>${(cierreActivoParaImprimir?.totalDomicilios ?? totalDomiciliosRecaudados).toLocaleString()} COP</span>
                </div>

                <p className="text-[9px] text-slate-500 pt-1 text-center">
                  Liquidación de tarifas de transporte entregadas a los domiciliarios de turno.
                </p>
              </div>
            )}

            <div className="text-center pt-2">
              <p className="text-[10px] text-slate-500">{empresa.eslogan}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => {
                  setReporteCierreTipo(null);
                  setCierreActivoParaImprimir(null);
                }} 
                className="flex-1 bg-slate-200 text-slate-800 py-2.5 rounded-xl font-sans font-bold hover:bg-slate-300 text-xs"
              >
                Volver
              </button>
              <button 
                onClick={() => window.print()} 
                className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-sans font-bold hover:bg-slate-800 text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FACTURACIÓN Y PAGO */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Liquidar Factura</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
              {['mesa', 'domicilio', 'llevar'].map(tipo => (
                <button 
                  key={tipo} 
                  onClick={() => setPayServiceType(tipo)}
                  className={`py-2 rounded-xl capitalize ${payServiceType === tipo ? 'bg-amber-500 text-white' : 'bg-slate-950 text-slate-400'}`}
                >
                  {tipo}
                </button>
              ))}
            </div>

            {payServiceType === 'domicilio' && (
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Domiciliario</label>
                  <input 
                    type="text" 
                    value={domicilioData.repartidor} 
                    onChange={e => setDomicilioData({ ...domicilioData, repartidor: e.target.value })} 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white" 
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Valor Flete ($)</label>
                  <input 
                    type="number" 
                    value={domicilioData.valor} 
                    onChange={e => setDomicilioData({ ...domicilioData, valor: e.target.value })} 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white" 
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold block">Forma de Pago:</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button 
                  onClick={() => setPayMethod('efectivo')}
                  className={`py-2.5 rounded-xl border ${payMethod === 'efectivo' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  💵 Efectivo
                </button>
                <button 
                  onClick={() => setPayMethod('transferencia')}
                  className={`py-2.5 rounded-xl border ${payMethod === 'transferencia' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  💳 Transferencia
                </button>
              </div>
            </div>

            {payMethod === 'efectivo' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Efectivo Recibido:</span>
                  <input 
                    type="number" 
                    value={efectivoRecibido} 
                    onChange={e => setEfectivoRecibido(e.target.value)} 
                    placeholder="Monto entregado..." 
                    className="w-36 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-right text-emerald-400 font-bold"
                  />
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Cambio a Entregar:</span>
                  <span className="font-bold text-amber-400">${cambioEfectivo.toLocaleString()} COP</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-white">Total a Cobrar:</span>
              <span className="text-xl font-extrabold text-emerald-400">${totalPagar.toLocaleString()} COP</span>
            </div>

            <button 
              onClick={handleCompletarPago} 
              className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all text-sm"
            >
              Completar Pago
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE SOLICITUD DE INSUMOS */}
      {modalSolicitud && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-white text-sm">Solicitud de Reposición</h3>
            <p className="text-xs text-slate-400">Insumo: <span className="font-bold text-white">{modalSolicitud.nombre}</span></p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Cantidad a Solicitar ({modalSolicitud.unidad})</label>
              <input 
                type="number" 
                value={cantSolicitar} 
                onChange={e => setCantSolicitar(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" 
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Observación</label>
              <textarea 
                value={obsSolicitud} 
                onChange={e => setObsSolicitud(e.target.value)} 
                placeholder="Motivo de urgencia..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white h-20 resize-none" 
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setModalSolicitud(null)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold">Cancelar</button>
              <button 
                onClick={() => {
                  if (!cantSolicitar || isNaN(cantSolicitar)) return;
                  const sol = {
                    id: `SOL-0${solicitudesStock.length + 1}`,
                    insumoId: modalSolicitud.id,
                    insumoNombre: modalSolicitud.nombre,
                    unidad: modalSolicitud.unidad,
                    cantidadSolicitada: Number(cantSolicitar),
                    solicitante: `${currentUser.nombre} (${currentUser.bloque})`,
                    fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    observacion: obsSolicitud || 'Insumo escaso.',
                    estado: 'pendiente'
                  };
                  setSolicitudesStock([sol, ...solicitudesStock]);
                  const textoWA = encodeURIComponent(
                    `⚠️ *ALERTA DE STOCK - ${empresa.nombre}*\n\n` +
                    `Solicitante: ${currentUser.nombre} (${currentUser.bloque})\n` +
                    `Insumo: *${modalSolicitud.nombre}*\n` +
                    `Cantidad requerida: *${cantSolicitar} ${modalSolicitud.unidad}*\n` +
                    `Stock actual en sistema: ${modalSolicitud.stock} ${modalSolicitud.unidad}\n` +
                    `Nota: ${obsSolicitud || 'Sin observaciones'}`
                  );
                  window.open(`https://api.whatsapp.com/send?phone=573145550199&text=${textoWA}`, '_blank');
                  setModalSolicitud(null);
                }} 
                className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE USUARIOS */}
      {modalUsuario && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                {editingUserId ? 'Editar Perfil de Usuario' : 'Registrar Nuevo Personal'}
              </h3>
              <button onClick={() => setModalUsuario(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!userFormData.nombre || !userFormData.email || !userFormData.pin) {
                alert('Diligencie los campos obligatorios.');
                return;
              }

              if (editingUserId) {
                setUsuarios(usuarios.map(u => u.id === editingUserId ? {
                  ...u,
                  nombre: userFormData.nombre,
                  apellidos: userFormData.apellidos,
                  cedula: userFormData.cedula,
                  telefono: userFormData.telefono,
                  email: userFormData.email,
                  pin: userFormData.pin,
                  bloque: userFormData.bloque,
                  fechaIngreso: userFormData.fechaIngreso,
                  foto: userFormData.foto,
                  contactoEmergencia: {
                    nombre: userFormData.emergenciaNombre,
                    telefono: userFormData.emergenciaTelefono
                  },
                  modulos: userFormData.modulos
                } : u));
              } else {
                const nuevo = {
                  id: `usr-${Date.now()}`,
                  nombre: userFormData.nombre,
                  apellidos: userFormData.apellidos,
                  cedula: userFormData.cedula,
                  telefono: userFormData.telefono,
                  email: userFormData.email,
                  pin: userFormData.pin,
                  bloque: userFormData.bloque,
                  fechaIngreso: userFormData.fechaIngreso,
                  foto: userFormData.foto,
                  contactoEmergencia: {
                    nombre: userFormData.emergenciaNombre,
                    telefono: userFormData.emergenciaTelefono
                  },
                  modulos: userFormData.modulos
                };
                setUsuarios([...usuarios, nuevo]);
              }
              setModalUsuario(false);
            }} className="space-y-4 text-xs">
              <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                  {userFormData.foto ? (
                    <img src={userFormData.foto} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-bold text-white block mb-1">Foto de Perfil</span>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl font-semibold transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar Foto (PNG)</span>
                    <input 
                      type="file" 
                      accept="image/png, image/svg+xml, image/webp, image/jpeg" 
                      className="hidden" 
                      onChange={e => handleLocalImageUpload(e, base64 => setUserFormData({ ...userFormData, foto: base64 }))} 
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Nombres *</label>
                  <input 
                    type="text" 
                    value={userFormData.nombre} 
                    onChange={e => setUserFormData({ ...userFormData, nombre: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Apellidos *</label>
                  <input 
                    type="text" 
                    value={userFormData.apellidos} 
                    onChange={e => setUserFormData({ ...userFormData, apellidos: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Cédula de Ciudadanía *</label>
                  <input 
                    type="text" 
                    value={userFormData.cedula} 
                    onChange={e => setUserFormData({ ...userFormData, cedula: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Número de Contacto *</label>
                  <input 
                    type="text" 
                    value={userFormData.telefono} 
                    onChange={e => setUserFormData({ ...userFormData, telefono: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Correo Electrónico (Login) *</label>
                  <input 
                    type="email" 
                    value={userFormData.email} 
                    onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">PIN / Contraseña *</label>
                  <input 
                    type="password" 
                    value={userFormData.pin} 
                    onChange={e => setUserFormData({ ...userFormData, pin: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Bloque / Rol</label>
                  <select 
                    value={userFormData.bloque} 
                    onChange={e => setUserFormData({ ...userFormData, bloque: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="administrativo">Administrativo</option>
                    <option value="cajeros">Cajeros</option>
                    <option value="meseros">Meseros</option>
                    <option value="cocina">Cocina</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Fecha de Ingreso</label>
                  <input 
                    type="date" 
                    value={userFormData.fechaIngreso} 
                    onChange={e => setUserFormData({ ...userFormData, fechaIngreso: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none" 
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 block">Contacto de Emergencia</span>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    placeholder="Nombre completo..." 
                    value={userFormData.emergenciaNombre} 
                    onChange={e => setUserFormData({ ...userFormData, emergenciaNombre: e.target.value })} 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none" 
                  />
                  <input 
                    type="text" 
                    placeholder="Teléfono contacto..." 
                    value={userFormData.emergenciaTelefono} 
                    onChange={e => setUserFormData({ ...userFormData, emergenciaTelefono: e.target.value })} 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none" 
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalUsuario(false)} 
                  className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-bold hover:brightness-110 shadow-lg shadow-orange-600/20"
                >
                  {editingUserId ? 'Guardar Cambios' : 'Registrar Personal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE TIRILLA POS NORMAL DE MESA */}
      {facturaImprimir && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-xs w-full font-mono text-[11px] shadow-2xl space-y-3">
            <div className="text-center space-y-1">
              {logos.pos && (
                <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                  <img src={logos.pos} alt="POS Logo" className="w-full h-full object-contain grayscale" />
                </div>
              )}
              <h4 className="font-extrabold text-sm">{empresa.nombre}</h4>
              <p>NIT: {empresa.nit}</p>
              <p>{empresa.direccion}</p>
              <p>Tel: {empresa.telefono}</p>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
              <p>Factura: <strong>{facturaImprimir.id}</strong></p>
              <p>Fecha: {facturaImprimir.fecha}</p>
              <p>Cliente: {facturaImprimir.cliente}</p>
              <p>NIT/CC: {facturaImprimir.doc}</p>
              <p>Cajero: {facturaImprimir.cajero}</p>
            </div>

            <div className="space-y-1">
              {facturaImprimir.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.cantidad}x {it.nombre}</span>
                  <span>${(it.cantidad * it.precio).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 font-bold">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>${facturaImprimir.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>IMPOCONSUMO:</span>
                <span>${facturaImprimir.impuesto.toLocaleString()}</span>
              </div>
              {facturaImprimir.domicilio > 0 && (
                <div className="flex justify-between">
                  <span>DOMICILIO:</span>
                  <span>${facturaImprimir.domicilio.toLocaleString()}</span>
                </div>
              )}
              {facturaImprimir.propina > 0 && (
                <div className="flex justify-between">
                  <span>PROPINA:</span>
                  <span>${facturaImprimir.propina.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span>${facturaImprimir.total.toLocaleString()} COP</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-dashed border-slate-300">
              <p>¡Gracias por su visita!</p>
              <p className="text-[9px] text-slate-500 mt-1">{empresa.eslogan}</p>
            </div>

            <button 
              onClick={() => setFacturaImprimir(null)} 
              className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-sans font-bold hover:bg-slate-800"
            >
              Cerrar Ticket
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE RECETA */}
      {modalReceta && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{modalReceta.imagen}</span>
                <div>
                  <h3 className="font-bold text-white text-sm">Receta: {modalReceta.nombre}</h3>
                  <span className="text-xs text-amber-400">${modalReceta.precio.toLocaleString()} COP</span>
                </div>
              </div>
              <button onClick={() => setModalReceta(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <span className="text-slate-400 font-bold block">Añadir Componente a la Receta:</span>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7">
                  <select 
                    value={nuevoInsumoReceta.insumoId} 
                    onChange={e => setNuevoInsumoReceta({ ...nuevoInsumoReceta, insumoId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none"
                  >
                    <option value="">Seleccione insumo...</option>
                    {materiaPrima.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre} ({m.unidad})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Cantidad"
                    value={nuevoInsumoReceta.cantidad} 
                    onChange={e => setNuevoInsumoReceta({ ...nuevoInsumoReceta, cantidad: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none text-right font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      if (!nuevoInsumoReceta.insumoId || !nuevoInsumoReceta.cantidad || Number(nuevoInsumoReceta.cantidad) <= 0) {
                        alert('Seleccione un insumo y una cantidad válida.');
                        return;
                      }
                      const existe = tempReceta.find(r => r.insumoId === nuevoInsumoReceta.insumoId);
                      if (existe) {
                        setTempReceta(tempReceta.map(r => r.insumoId === nuevoInsumoReceta.insumoId ? { ...r, cantidad: Number(nuevoInsumoReceta.cantidad) } : r));
                      } else {
                        setTempReceta([...tempReceta, { insumoId: nuevoInsumoReceta.insumoId, cantidad: Number(nuevoInsumoReceta.cantidad) }]);
                      }
                      setNuevoInsumoReceta({ insumoId: '', cantidad: '' });
                    }}
                    className="w-full h-full bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {tempReceta.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No hay insumos añadidos a esta receta aún.</p>
              ) : (
                tempReceta.map((ing, idx) => {
                  const ins = materiaPrima.find(m => m.id === ing.insumoId);
                  const costoIngrediente = ins ? ins.costo * ing.cantidad : 0;

                  return (
                    <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs">
                      <div>
                        <span className="font-bold text-white block">{ins ? ins.nombre : 'Insumo'}</span>
                        <span className="text-[11px] text-amber-400 font-semibold">{ing.cantidad} {ins ? ins.unidad : ''} (${Math.round(costoIngrediente).toLocaleString()} COP)</span>
                      </div>
                      <button 
                        onClick={() => setTempReceta(tempReceta.filter(r => r.insumoId !== ing.insumoId))}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button onClick={() => setModalReceta(null)} className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold">Cancelar</button>
              <button 
                onClick={() => {
                  if (!modalReceta) return;
                  setMenuItems(menuItems.map(p => p.id === modalReceta.id ? { ...p, receta: tempReceta } : p));
                  setModalReceta(null);
                  alert('Receta actualizada exitosamente.');
                }} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20"
              >
                Guardar Receta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMPLETO DE COMANDA Y MENÚ POR MESA */}
      {selectedTable && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 lg:p-8 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base tracking-wide">{selectedTable.nombre}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedTable.estado === 'libre' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {selectedTable.estado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Atiende: {selectedTable.mesero || `${currentUser.nombre} ${currentUser.apellidos}`} • Capacidad: {selectedTable.capacidad} personas</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTable(null)} 
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col p-6 overflow-hidden border-r border-slate-800">
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
                  {categoriasMenu.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoriaMenu(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        selectedCategoriaMenu === cat 
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-105' 
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {menuItems
                      .filter(item => item.categoria === selectedCategoriaMenu)
                      .map(plato => (
                        <div
                          key={plato.id}
                          onClick={() => handleAddToComanda(plato)}
                          className="bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-amber-500/5 transition-all group active:scale-[0.98]"
                        >
                          <div className="space-y-2">
                            <div className="w-full h-24 bg-slate-900 rounded-xl flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                              {plato.imagen}
                            </div>
                            <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                              {plato.nombre}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {plato.descripcion}
                            </p>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-sm font-extrabold text-amber-400">
                              ${plato.precio.toLocaleString()} COP
                            </span>
                            <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                              <Plus className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="w-96 bg-slate-950/60 flex flex-col justify-between p-6 overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Productos en Mesa</span>
                    <span className="text-xs font-bold text-amber-400">
                      {(Array.isArray(selectedTable.comanda) ? selectedTable.comanda : []).reduce((acc, it) => acc + it.cantidad, 0)} items
                    </span>
                  </div>

                  {(!selectedTable.comanda || selectedTable.comanda.length === 0) ? (
                    <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                      <UtensilsCrossed className="w-8 h-8 stroke-1 text-slate-600" />
                      <p className="text-xs">No hay productos en esta mesa.<br/>Toca un plato a la izquierda para agregarlo.</p>
                    </div>
                  ) : (
                    selectedTable.comanda.map(item => (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-white truncate">{item.nombre}</h5>
                          <span className="text-[11px] text-amber-400 font-semibold">
                            ${(item.precio * item.cantidad).toLocaleString()} COP
                          </span>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
                          <button 
                            onClick={() => handleRemoveFromComanda(item.id)}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
                          >
                            -
                          </button>
                          <span className="text-xs font-extrabold text-white w-4 text-center">{item.cantidad}</span>
                          <button 
                            onClick={() => handleAddToComanda(item)}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal Consumo:</span>
                      <span className="text-white font-semibold">${subtotalComanda.toLocaleString()} COP</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Impoconsumo (8%):</span>
                      <span className="text-white font-semibold">${impoconsumoCalculado.toLocaleString()} COP</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-800/80">
                      <span className="text-white">Total Mesa:</span>
                      <span className="text-emerald-400 font-extrabold">
                        ${(subtotalComanda + impoconsumoCalculado).toLocaleString()} COP
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={!selectedTable.comanda || selectedTable.comanda.length === 0}
                    onClick={() => setIsPayModalOpen(true)}
                    className="w-full bg-emerald-600 disabled:opacity-40 text-white font-extrabold py-3.5 rounded-2xl hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-lg shadow-emerald-600/20 text-sm flex items-center justify-center gap-2"
                  >
                    <span>Proceder al Cobro</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}