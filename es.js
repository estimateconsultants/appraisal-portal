// Spanish for the client portal. Translates what app.js draws (screens, toasts, server messages) as it appears,
// so app.js stays in one language. Spanish speakers reach us by text or email (no calls), so call links become text links.
'use strict';
(function () {
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'es' || q === 'en') store.set('ec_lang', q);
  const saved = store.get('ec_lang');
  const LANG = saved || ((navigator.language || '').toLowerCase().indexOf('es') === 0 ? 'es' : 'en');
  window.EC_LANG = LANG;

  // Header switch
  function addSwitch() {
    const hdr = document.querySelector('.top .in-top'); if (!hdr || document.getElementById('langBtn')) return;
    const b = document.createElement('button'); b.id = 'langBtn'; b.type = 'button'; b.className = 'langbtn';
    b.textContent = LANG === 'es' ? 'English' : 'Español'; b.lang = LANG === 'es' ? 'en' : 'es';
    b.onclick = () => { store.set('ec_lang', LANG === 'es' ? 'en' : 'es'); location.reload(); };
    const me = document.getElementById('meBtn'); hdr.insertBefore(b, me);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addSwitch); else addSwitch();
  if (LANG !== 'es') return;
  document.documentElement.lang = 'es';
  document.title = 'Su reclamo · Estimate Consultants';

  const STATES = { 'North Carolina': 'Carolina del Norte', 'South Carolina': 'Carolina del Sur', 'North Dakota': 'Dakota del Norte', 'South Dakota': 'Dakota del Sur',
    'West Virginia': 'Virginia Occidental', 'New York': 'Nueva York', 'New Jersey': 'Nueva Jersey', 'New Mexico': 'Nuevo México', 'New Hampshire': 'Nuevo Hampshire',
    'Pennsylvania': 'Pensilvania', 'Hawaii': 'Hawái', 'Louisiana': 'Luisiana', 'Mississippi': 'Misisipi', 'Missouri': 'Misuri', 'District of Columbia': 'Distrito de Columbia', 'Rhode Island': 'Rhode Island' };
  const ST_RE = new RegExp('\\b(' + Object.keys(STATES).sort((a, b) => b.length - a.length).join('|') + ')\\b', 'g');
  const MON = { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sep', Oct: 'oct', Nov: 'nov', Dec: 'dic' };
  const st = (s) => s.replace(ST_RE, (m) => STATES[m]).replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})(?:, (\d{4}))?\b/g, (m, mo, d, y) => d + ' ' + MON[mo] + (y ? ' ' + y : ''));

  // Whole text nodes
  const X = {
    'Sign in to your claim': 'Entre a su reclamo', 'We’ll email you a 6-digit code. There’s no password to remember.': 'Le enviaremos un código de 6 dígitos por correo. No necesita contraseña.',
    'Email': 'Correo electrónico', 'Send my code': 'Enviar mi código', 'Check your email': 'Revise su correo', 'Enter the code we sent to': 'Escriba el código que enviamos a',
    '. It can take a minute to arrive.': '. Puede tardar un minuto en llegar.', 'Keep me signed in on this device for 30 days': 'Mantener mi sesión en este dispositivo por 30 días',
    'Open my claim': 'Abrir mi reclamo', 'Send a new code': 'Enviar un código nuevo', 'Use a different email': 'Usar otro correo',
    'Your name and phone': 'Su nombre y teléfono', 'These go on your claim file.': 'Se guardan en el expediente de su reclamo.', 'Full name': 'Nombre completo', 'Phone': 'Teléfono',
    'Continue': 'Continuar', 'Back': 'Atrás', 'What’s the appraisal for?': '¿Para qué es el avalúo?', 'After an accident': 'Después de un accidente', 'Other appraisals': 'Otros avalúos',
    'Diminished value': 'Valor disminuido', 'The value your car lost after an accident someone else caused': 'El valor que perdió su auto después de un accidente que causó otra persona',
    'North Carolina appraisal': 'Avalúo de Carolina del Norte', 'Diminished value through the NC appraisal process, NC cars only': 'Valor disminuido por el proceso de avalúo de Carolina del Norte, solo para accidentes allí',
    'Total loss': 'Pérdida total', 'The insurer’s total loss offer looks too low': 'La oferta de pérdida total de la aseguradora parece muy baja',
    'Estate or probate': 'Herencia o sucesión', 'A vehicle’s value for an estate': 'El valor de un vehículo para una herencia', 'Divorce': 'Divorcio', 'A vehicle’s value for a settlement': 'El valor de un vehículo para un acuerdo',
    'Bank or lender': 'Banco o prestamista', 'Value for a loan or collateral': 'Valor para un préstamo o garantía', 'IRS donation': 'Donación (IRS)', 'Value for a donated vehicle': 'Valor de un vehículo donado',
    'Classic or exotic': 'Clásico o exótico', 'Collector, exotic and custom vehicles': 'Vehículos de colección, exóticos y personalizados', 'Heavy equipment': 'Maquinaria pesada',
    'Construction and farm equipment': 'Equipo de construcción y agrícola', 'RV or camper': 'Casa rodante o camper', 'Motorhomes, campers and trailers': 'Casas rodantes, campers y remolques',
    'Not sure which one? Start with diminished value': '¿No está seguro? Empiece con valor disminuido',
    'What ZIP code is the car insured at?': '¿Cuál es el código postal donde está asegurado el auto?', 'Your policy’s state decides what your own coverage includes.': 'El estado de su póliza define lo que cubre su propio seguro.',
    'ZIP code': 'Código postal', 'Enter the 5-digit ZIP code': 'Escriba el código postal de 5 dígitos', 'Which state was the accident in?': '¿En qué estado fue el accidente?',
    'That state’s law sets the deadline and the rules for a claim against the other driver.': 'La ley de ese estado fija el plazo y las reglas de un reclamo contra el otro conductor.', 'State': 'Estado',
    'Your vehicle': 'Su vehículo', 'The VIN tells us the year, make and model.': 'El VIN nos dice el año, la marca y el modelo.', 'VIN': 'VIN', '(17 characters, on the registration or driver’s door)': '(17 caracteres, en el registro o en la puerta del conductor)',
    'Mileage': 'Millaje', 'Looking it up…': 'Buscando…', 'We couldn’t read that VIN. Please check it.': 'No pudimos leer ese VIN. Revíselo, por favor.',
    'Who was at fault?': '¿Quién tuvo la culpa?', 'The other driver': 'El otro conductor', 'The other driver, and they had no insurance': 'El otro conductor, y no tenía seguro',
    'The other driver, without enough insurance': 'El otro conductor, sin suficiente seguro', 'Partly me, partly the other driver': 'En parte yo, en parte el otro conductor', 'Me': 'Yo', 'Not decided yet': 'Todavía no se decide',
    'When was the accident?': '¿Cuándo fue el accidente?', 'Date of the accident': 'Fecha del accidente', 'Any earlier accident?': '¿Algún accidente anterior?',
    'Before this one. We’ll verify the vehicle’s accident history.': 'Antes de este. Verificaremos el historial de accidentes del vehículo.', 'No': 'No', 'Yes': 'Sí', 'Not sure': 'No estoy seguro',
    'Is the car leased?': '¿El auto es arrendado (leasing)?', 'Yes, it’s leased': 'Sí, es arrendado', 'Has it been repaired?': '¿Ya lo repararon?', 'We can start either way.': 'Podemos empezar de cualquier forma.',
    'Yes, repairs are done': 'Sí, ya está reparado', 'Being repaired now': 'Lo están reparando', 'Not yet': 'Todavía no',
    'How do you want to handle the insurer?': '¿Cómo quiere manejar a la aseguradora?', 'Full service: the $199 isn’t charged if the insurer’s offer doesn’t reach $498.': 'Servicio completo: no se cobran los $199 si la oferta de la aseguradora no llega a $498.',
    'We handle it: $299 now, $199 when the offer comes in': 'Nosotros lo manejamos: $299 ahora, $199 cuando llegue la oferta', 'You handle it: $299, with our appraisal and a demand letter': 'Usted lo maneja: $299, con nuestro avalúo y una carta de reclamo',
    'Check your lease first': 'Primero revise su contrato de arrendamiento',
    'On a leased car, the leasing company may own the diminished value claim, since they own the car. Your lease or the leasing company can tell you who can file it. We can still do your appraisal either way.': 'En un auto arrendado, la compañía de arrendamiento puede ser dueña del reclamo de valor disminuido, porque el auto es suyo. Su contrato o la compañía le pueden decir quién puede presentarlo. Igual podemos hacer su avalúo.',
    'Change my answer': 'Cambiar mi respuesta', 'Check your details': 'Revise sus datos', 'Your claim qualifies': 'Su reclamo califica',
    'Name': 'Nombre', 'Vehicle': 'Vehículo', 'Service': 'Servicio', 'Insured at': 'Asegurado en', 'Accident in': 'Accidente en', 'At fault': 'Culpa', 'Accident date': 'Fecha del accidente',
    'Earlier accident': 'Accidente anterior', 'Leased': 'Arrendado', 'Repairs': 'Reparaciones', 'Set up my claim': 'Crear mi reclamo', 'Change something': 'Cambiar algo', 'Setting up your claim': 'Creando su reclamo',
    'Your claims': 'Sus reclamos', 'You don’t have a claim with us yet.': 'Todavía no tiene un reclamo con nosotros.', 'Start a new claim': 'Empezar un reclamo nuevo', 'Opening your claim': 'Abriendo su reclamo',
    'We need from you': 'Necesitamos de usted', 'Your documents': 'Sus documentos', 'Upload': 'Subir', 'Add more': 'Agregar más', 'Checked': 'Revisado',
    'Anything else': 'Algo más', 'Other photos or documents you want us to have': 'Otras fotos o documentos que quiera enviarnos', 'Other documents': 'Otros documentos',
    'Photos or PDFs. We’ll check each one and mark it when it’s good.': 'Fotos o PDF. Revisaremos cada uno y lo marcaremos cuando esté bien.',
    'The insurer’s offer': 'La oferta de la aseguradora', 'Offer amount': 'Monto de la oferta', 'Save': 'Guardar', 'Change it': 'Cambiarla', 'Progress': 'Avance', 'Latest update': 'Última novedad',
    'Questions? Email': '¿Preguntas? Escríbanos a', 'Your claims ': 'Sus reclamos', 'Sign out': 'Cerrar sesión', 'Your account': 'Su cuenta',
    'Choose another photo': 'Elegir otra foto', 'Send it anyway': 'Enviarla de todos modos', 'This photo looks blurry.': 'Esta foto se ve borrosa.', 'This photo looks too dark to read.': 'Esta foto está muy oscura.',
    'This photo is very small, so details may not show.': 'Esta foto es muy pequeña y puede que no se vean los detalles.',
    'Change an answer': 'Cambiar una respuesta', 'Get a MarketTrue Valuation Report': 'Obtener un Informe de Valoración MarketTrue',
    'Partly at fault': 'Culpa compartida', 'You were at fault': 'Usted tuvo la culpa', 'Fault isn’t decided yet': 'La culpa todavía no se decide', 'Past the deadline': 'Pasó el plazo',
    'The car is over 10 years old': 'El auto tiene más de 10 años', 'Over 100,000 miles': 'Más de 100,000 millas', 'An earlier accident': 'Un accidente anterior', 'North Carolina only': 'Solo Carolina del Norte', 'Not available': 'No disponible',
    'Agreement signed': 'Acuerdo firmado', 'Documents in': 'Documentos recibidos', 'Appraisal finished': 'Avalúo terminado', 'Sent to the insurer': 'Enviado a la aseguradora', 'Offer received': 'Oferta recibida',
    'Final payment': 'Pago final', 'Settled': 'Resuelto', 'Appraisal clause started': 'Cláusula de avalúo iniciada', 'Award': 'Decisión', 'Delivered': 'Entregado',
    'Registration': 'Registro del vehículo', 'Photo of the front is fine': 'Basta con una foto del frente', 'Odometer photo': 'Foto del odómetro', 'Car on, mileage showing': 'Auto encendido, con el millaje visible',
    'Final repair invoice': 'Factura final de la reparación', 'Vehicle photos': 'Fotos del vehículo', 'All four corners and the repaired area': 'Las cuatro esquinas y el área reparada', 'All four corners and the interior': 'Las cuatro esquinas y el interior',
    'Insurer valuation report': 'Informe de valoración de la aseguradora', 'The full report, every page': 'El informe completo, todas las páginas', 'Offer letter or email': 'Carta o correo con la oferta',
    'Before the accident, if you have them': 'De antes del accidente, si las tiene', 'Registration or title': 'Registro o título', 'Title': 'Título', 'Front and back': 'Frente y reverso',
    'Damage photos': 'Fotos de los daños', 'Close-ups of the damaged areas': 'De cerca, las áreas dañadas', 'Repaired area photos': 'Fotos del área reparada', 'After repairs, in good light': 'Después de la reparación, con buena luz',
    'Repair estimate': 'Estimado de reparación', 'From the insurer or the shop': 'De la aseguradora o del taller', 'Photos before the accident': 'Fotos de antes del accidente', 'If you have them': 'Si las tiene',
    'Window sticker or build sheet': 'Etiqueta de ventana u hoja de fabricación', 'Shows the options': 'Muestra el equipamiento', 'Maintenance records': 'Registros de mantenimiento', 'Receipts for upgrades': 'Recibos de mejoras',
    'Aftermarket parts, tires, and so on': 'Piezas adicionales, llantas, etc.', 'Insurance declarations page': 'Página de declaraciones del seguro', 'Police or accident report': 'Reporte policial o del accidente',
    'Claim letter from the insurer': 'Carta de la aseguradora sobre el reclamo', 'Shows the claim number': 'Muestra el número de reclamo', 'Loan payoff letter': 'Carta de saldo del préstamo', 'Driver’s license': 'Licencia de conducir',
    "Driver's license": 'Licencia de conducir', 'Front only': 'Solo el frente', 'Estate paperwork': 'Documentos de la herencia', 'Such as letters testamentary': 'Como las cartas testamentarias', 'Donation receipt': 'Recibo de la donación', 'From the charity': 'De la organización benéfica',
    'Diminished value is claimed from the at-fault driver’s insurer.': 'El valor disminuido se reclama a la aseguradora del conductor culpable.',
    // toasts and server messages
    'New code sent.': 'Le enviamos un código nuevo.', 'Couldn’t send it. Try again.': 'No se pudo enviar. Inténtelo de nuevo.', 'Enter all 6 digits.': 'Escriba los 6 dígitos.',
    'Couldn’t check the code. Try again.': 'No se pudo revisar el código. Inténtelo de nuevo.', 'Couldn’t save. Try again.': 'No se pudo guardar. Inténtelo de nuevo.',
    'Please check the email address.': 'Revise el correo electrónico, por favor.', 'Couldn’t send the code. Check your connection and try again.': 'No se pudo enviar el código. Revise su conexión e inténtelo de nuevo.',
    'Enter a valid 5-digit ZIP code.': 'Escriba un código postal válido de 5 dígitos.', 'Pick the date of the accident.': 'Elija la fecha del accidente.', 'Enter the 17-character VIN.': 'Escriba el VIN de 17 caracteres.',
    'We need a VIN we can read.': 'Necesitamos un VIN que podamos leer.', 'Enter the mileage.': 'Escriba el millaje.', 'Your claim is set up.': 'Su reclamo está creado.',
    'This vehicle already has a file. Here it is.': 'Este vehículo ya tiene un expediente. Aquí está.', 'Couldn’t save your claim. Try again.': 'No se pudo guardar su reclamo. Inténtelo de nuevo.',
    'Couldn’t save your claim. Check your connection and try again.': 'No se pudo guardar su reclamo. Revise su conexión e inténtelo de nuevo.', 'Please sign in again.': 'Vuelva a iniciar sesión, por favor.',
    'Enter the amount of the offer.': 'Escriba el monto de la oferta.', 'Offer saved.': 'Oferta guardada.', 'Couldn’t save the offer.': 'No se pudo guardar la oferta.',
    'Couldn’t save the offer. Check your connection and try again.': 'No se pudo guardar la oferta. Revise su conexión e inténtelo de nuevo.',
    'Sent. We’ll check it and mark it when it’s good.': 'Enviado. Lo revisaremos y lo marcaremos cuando esté bien.', 'Couldn’t load your account. Check your connection and refresh.': 'No se pudo cargar su cuenta. Revise su conexión y actualice la página.',
    'Please enter a 10-digit phone number.': 'Escriba un número de teléfono de 10 dígitos.', 'Please enter a valid 5-digit US ZIP code.': 'Escriba un código postal válido de 5 dígitos.',
    'Please enter your first and last name.': 'Escriba su nombre y apellido.', 'Please upload a photo or a PDF.': 'Suba una foto o un PDF, por favor.',
    'Please use your own email address rather than a shared one (like info@).': 'Use su propio correo, no uno compartido (como info@).', 'Please use your real email address. We send your results there.': 'Use su correo real. Allí le enviamos sus resultados.',
    'Something went wrong. Please try again, or call 910-333-6001.': 'Algo salió mal. Inténtelo de nuevo, o envíenos un mensaje de texto al 910-333-6001.', 'Temporary email addresses can’t be used. Please use your regular email.': 'No se pueden usar correos temporales. Use su correo habitual.',
    'That code doesn’t match. Please check it and try again.': 'Ese código no coincide. Revíselo e inténtelo de nuevo.', 'That code expired. Please send a new one.': 'Ese código venció. Pida uno nuevo.',
    'That file is too big. Please keep it under 20 MB.': 'Ese archivo es muy grande. Debe pesar menos de 20 MB.', 'This link has expired. Call or text 910-333-6001, or email customerservice@estimateconsultants.com.': 'Este enlace venció. Envíenos un mensaje de texto al 910-333-6001 o escriba a customerservice@estimateconsultants.com.',
    'This link has expired.': 'Este enlace venció.', 'Too many codes requested. Please wait a few minutes and try again.': 'Pidió demasiados códigos. Espere unos minutos e inténtelo de nuevo.', 'Too many tries. Please send a new code.': 'Demasiados intentos. Pida un código nuevo.',
    'We’re getting a lot of sign-ins right now. Please try again in a few minutes.': 'Hay muchos inicios de sesión en este momento. Inténtelo en unos minutos.', 'You already sent this one.': 'Ya envió este archivo.',
    'That claim wasn’t found on your account.': 'Ese reclamo no está en su cuenta.',
    'Payments': 'Pagos',
    'Your agreement': 'Su acuerdo', 'Not yet due': 'Todavía no se cobra', 'Sign first': 'Firme primero', 'Sign your agreement above, then you can pay here.': 'Firme su acuerdo arriba y luego podrá pagar aquí.', 'Please sign your agreement first. Then you can pay here.': 'Primero firme su acuerdo. Luego podrá pagar aquí.', 'Appraisal agreement': 'Acuerdo de avalúo', 'This allows us to speak to the insurer about your claim.': 'Esto nos permite hablar con la aseguradora sobre su reclamo.',
    'Signed': 'Firmado', 'Ready for you to sign': 'Listo para firmar', 'Sign': 'Firmar', 'Your finished documents': 'Sus documentos terminados', 'Available once your balance is paid': 'Disponible cuando pague su saldo',
    'Locked': 'Bloqueado', 'Download': 'Descargar', 'Opening…': 'Abriendo…', 'Payment': 'Pago', 'Close': 'Cerrar', 'Couldn’t open that document.': 'No se pudo abrir ese documento.',
    'Couldn’t open that document. Check your connection and try again.': 'No se pudo abrir ese documento. Revise su conexión e inténtelo de nuevo.', 'Couldn’t load the payment form. Check your connection and try again.': 'No se pudo cargar el formulario de pago. Revise su conexión e inténtelo de nuevo.',
    'Your documents open once your balance is paid.': 'Sus documentos se abren cuando pague su saldo.', 'That document isn’t available.': 'Ese documento no está disponible.', "That document isn't available.": 'Ese documento no está disponible.',
    'This is the insurer’s final offer. We presented our appraisal and pushed for as close to our value as we could, and this is the most they’re willing to pay. Would you like to accept it?': 'Esta es la oferta final de la aseguradora. Presentamos nuestro avalúo e insistimos para acercarnos lo más posible a nuestro valor, y esto es lo máximo que están dispuestos a pagar. ¿Quiere aceptarla?',
    'We waived the $199 second payment.': 'No le cobraremos el segundo pago de $199.',
    'We recommend talking with an attorney before you decide. Many offer a free first consultation. Our appraisal can be used in any of these.': 'Le recomendamos hablar con un abogado antes de decidir. Muchos ofrecen una primera consulta gratis. Nuestro avalúo se puede usar en cualquiera de estas opciones.',
    'File in small claims court against the at-fault driver. Your state court’s website lists the limit.': 'Presentar una demanda en la corte de reclamos menores contra el conductor culpable. El sitio web de la corte de su estado indica el límite.',
    'Ask about South Carolina’s property damage arbitration.': 'Preguntar por el arbitraje de daños a la propiedad de Carolina del Sur.',
    'What to expect': 'Qué esperar', 'Where we expect it to settle': 'Dónde esperamos que se resuelva', 'General information, not legal advice.': 'Información general, no asesoría legal.',
    'Insurers often offer much less than the full diminished value at first. Getting the full amount can mean small claims court. We’ll give you our honest estimate of where it may settle once we’ve done the appraisal.': 'Las aseguradoras suelen ofrecer al principio mucho menos que el valor disminuido completo. Obtener el monto completo puede requerir la corte de reclamos menores. Le daremos nuestro estimado honesto de dónde puede resolverse cuando terminemos el avalúo.',
    'We’re still working with the insurer to get as close to our value as we can.': 'Seguimos trabajando con la aseguradora para acercarnos lo más posible a nuestro valor.',
    'This is the insurer’s final offer. We’ve done all we can with them. Do you want to accept it?': 'Esta es la oferta final de la aseguradora. Hicimos todo lo posible con ellos. ¿Quiere aceptarla?',
    'Accept the offer': 'Aceptar la oferta', 'Don’t accept': 'No aceptar', 'This is your decision. If you don’t accept, we’ll talk through what you can do next.': 'La decisión es suya. Si no la acepta, le explicaremos qué puede hacer después.',
    'We’ll note your choice and follow up with the next steps.': 'Anotaremos su decisión y le indicaremos los próximos pasos.', 'We’ll get in touch about what you can do next.': 'Nos comunicaremos con usted sobre lo que puede hacer después.',
    'Yes, accept it': 'Sí, aceptarla', 'Yes, don’t accept': 'Sí, no aceptarla', 'Go back': 'Volver', 'Thanks. We got your choice.': 'Gracias. Recibimos su decisión.',
    'Couldn’t save your choice.': 'No se pudo guardar su decisión.', 'Couldn’t save your choice. Check your connection and try again.': 'No se pudo guardar su decisión. Revise su conexión e inténtelo de nuevo.', 'Second payment': 'Segundo pago', 'Paid securely through Stripe. Your card details never reach us.': 'Pago seguro con Stripe. Los datos de su tarjeta nunca llegan a nosotros.',
    'Confirming your payment': 'Confirmando su pago', 'Payment received. Thank you.': 'Pago recibido. Gracias.', 'We’re still confirming your payment. It will show here shortly.': 'Todavía estamos confirmando su pago. Aparecerá aquí en un momento.',
    'Payments aren’t available right now.': 'Los pagos no están disponibles en este momento.', 'Payments aren\'t available right now. Please try again in a few minutes.': 'Los pagos no están disponibles en este momento. Inténtelo en unos minutos.',
    'Couldn’t open the payment page. Check your connection and try again.': 'No se pudo abrir la página de pago. Revise su conexión e inténtelo de nuevo.',
    'First payment': 'Primer pago', 'Second payment (the offer reached $498)': 'Segundo pago (la oferta llegó a $498)', 'Diminished value appraisal, self-service': 'Avalúo de valor disminuido, autoservicio',
    'Diminished value appraisal': 'Avalúo de valor disminuido', 'Total loss appraisal': 'Avalúo de pérdida total', 'Appraisal': 'Avalúo', "That claim wasn't found on your account.": 'Ese reclamo no está en su cuenta.'
  };
  // Pieces inside longer text (sentences joined together, or with names and numbers)
  const R = [
    [/^(\d+) of (\d+)$/, '$1 de $2'], [/^(\d+) to go$/, (m, n) => (n === '1' ? 'falta 1' : 'faltan ' + n)], [/^(\d+) of (\d+) done$/, '$1 de $2 listos'],
    [/^Sending (\d+) of (\d+)…$/, 'Enviando $1 de $2…'], [/^Received: /, 'Recibido: '], [/^Entered (.+)\.$/, 'Registrada el $1.'],
    [/^(.+), file (EC-[\w-]+)$/, (m, a, b) => tr(a) + ', expediente ' + b],
    [/In (.+?), you generally have (\d+) years from the accident to file suit if the claim isn’t resolved\. The insurer may close the claim sooner, so it’s best to start early\./, (m, s, n) => 'En ' + st(s) + ', por lo general tiene ' + n + ' años desde el accidente para presentar una demanda si el reclamo no se resuelve. La aseguradora puede cerrar el reclamo antes, así que es mejor empezar pronto.'],
    [/In (.+?), the general deadline to file suit for property damage is (\d+) years from the accident, and that time has passed\./, (m, s, n) => 'En ' + st(s) + ', el plazo general para demandar por daños a la propiedad es de ' + n + ' años desde el accidente, y ese tiempo ya pasó.'],
    [/Diminished value is claimed from the at-fault driver’s insurer, or your own (uninsured or underinsured|uninsured) motorist coverage in (.+?)\./, (m, k, s) => 'El valor disminuido se reclama a la aseguradora del conductor culpable, o a su propia cobertura de motorista ' + (k === 'uninsured' ? 'sin seguro' : 'sin seguro o con seguro insuficiente') + ' en ' + st(s) + '.'],
    [/^(.+): certified appraisals unavailable$/, (m, s) => st(s) + ': no hay avalúos certificados'], [/^Diminished value unavailable in (.+)$/, (m, s) => 'Valor disminuido no disponible en ' + st(s)],
    [/We can’t provide certified appraisals in (.+?)\./, (m, s) => 'No podemos hacer avalúos certificados en ' + st(s) + '.'], [/We don’t offer diminished value claims in (.+?)\./, (m, s) => 'No ofrecemos reclamos de valor disminuido en ' + st(s) + '.'],
    [/ Our MarketTrue Valuation Reports are still available there: an instant, uncertified report you can use with the insurer\./, ' Nuestros Informes de Valoración MarketTrue siguen disponibles allí: un informe instantáneo, no certificado, que puede usar con la aseguradora.'],
    [/This appraisal option is for accidents in North Carolina\. Choose “Diminished value” instead\./, 'Esta opción de avalúo es para accidentes en Carolina del Norte. Elija “Valor disminuido”.'],
    [/Diminished value is paid by the at-fault driver’s insurer, so there’s no claim when you were at fault\./, 'El valor disminuido lo paga la aseguradora del conductor culpable, así que no hay reclamo si usted tuvo la culpa.'],
    [/Diminished value is claimed once the other driver is found at fault\. Come back as soon as their insurer accepts fault\./, 'El valor disminuido se reclama cuando se determina que el otro conductor tuvo la culpa. Vuelva en cuanto su aseguradora acepte la culpa.'],
    [/(.+?) doesn’t allow a claim against the other driver when you were even partly at fault for the accident\./, (m, s) => st(s) + ' no permite reclamar al otro conductor si usted tuvo aunque sea parte de la culpa del accidente.'],
    [/Our diminished value appraisals are for vehicles 10 model years old or newer\./, 'Nuestros avalúos de valor disminuido son para vehículos de 10 años de modelo o menos.'],
    [/Our diminished value appraisals are for vehicles under 100,000 miles\./, 'Nuestros avalúos de valor disminuido son para vehículos con menos de 100,000 millas.'],
    [/Our diminished value appraisals are for vehicles with no accident before this one\. We verify the accident history on every claim\./, 'Nuestros avalúos de valor disminuido son para vehículos sin accidentes antes de este. Verificamos el historial de accidentes en cada reclamo.'],
    [/This claim doesn’t qualify\. Call us and we’ll talk it through\./, 'Este reclamo no califica. Envíenos un mensaje de texto y lo revisamos.'],
    [/^for a (.+)\.$/, (m, s) => 'para ' + low1(tr(s.charAt(0).toUpperCase() + s.slice(1))) + '.'],
    [/^(Total loss|Estate or probate|Divorce|Bank or lender|IRS donation|Classic or exotic|Heavy equipment|RV or camper) appraisal$/, (m, s) => 'Avalúo de ' + low1(X[s] || s)],
    [/^Diminished value, full service$/i, 'Valor disminuido, servicio completo'], [/^Diminished value, self-service$/i, 'Valor disminuido, autoservicio'], [/^North Carolina diminished value appraisal$/i, 'Avalúo de valor disminuido de Carolina del Norte'],
    [/^(\d+) files sent\. We’ll check them and mark them when they’re good\.$/, '$1 archivos enviados. Los revisaremos y los marcaremos cuando estén bien.'],
    [/^You already sent (.+)\.$/, 'Ya envió $1.'], [/^(.+) is over 20 MB\.$/, '$1 pesa más de 20 MB.'], [/^Couldn’t send (.+)\. Check your connection and try again\.$/, 'No se pudo enviar $1. Revise su conexión e inténtelo de nuevo.'],
    [/^We couldn’t open (.+)\. Try a JPG or PNG\.$/, 'No pudimos abrir $1. Pruebe con JPG o PNG.'], [/^(.+): please use a photo or a PDF\.$/, '$1: use una foto o un PDF.'],
    [/^(.+)\. A clear photo helps us get your appraisal right the first time\.$/, '$1. Una foto clara nos ayuda a hacer bien su avalúo desde la primera vez.'],
    [/Insurers often start well below the full diminished value, and some offer very little unless there’s real pressure behind the claim\. Getting the full amount can mean filing in small claims court against the at-fault driver\./, 'Las aseguradoras suelen empezar muy por debajo del valor disminuido completo, y algunas ofrecen muy poco si no hay presión real detrás del reclamo. Obtener el monto completo puede requerir presentar una demanda en la corte de reclamos menores contra el conductor culpable.'],
    [/ In North Carolina, if you and the insurer are far enough apart, either side can demand an appraisal, which can settle it without court\./, ' En Carolina del Norte, si usted y la aseguradora están lo bastante lejos, cualquiera de las partes puede exigir un avalúo, que puede resolverlo sin ir a corte.'],
    [/ That choice is yours, and our appraisal is built to be used there\./, ' Esa decisión es suya, y nuestro avalúo está hecho para usarse allí.'],
    [/^(\$[\d,.]+) to (\$[\d,.]+)$/, '$1 a $2'],
    [/^If you don’t accept, your usual options in (.+) are:$/, (m, s) => 'Si no la acepta, sus opciones habituales en ' + st(s) + ' son:'], [/^If you don’t accept, your usual options are:$/, 'Si no la acepta, sus opciones habituales son:'],
    [/^You generally have (\d+) years from the accident to file suit\.$/, 'Por lo general tiene $1 años desde el accidente para presentar una demanda.'],
    [/^File in (small claims court|magistrate court|justice court) for up to (\$[\d,]+)\.$/, (m, c, n) => 'Presentar una demanda en ' + ({ 'small claims court': 'la corte de reclamos menores', 'magistrate court': 'la corte de magistrados', 'justice court': 'la corte de paz (justice court)' })[c] + ' por hasta ' + n + '.'],
    [/^File in the small claims division of general district court for up to (\$[\d,]+)\.$/, 'Presentar una demanda en la división de reclamos menores de la corte general de distrito por hasta $1.'],
    [/^File in general sessions court, which handles civil cases up to (\$[\d,]+)\.$/, 'Presentar una demanda en la corte de sesiones generales, que atiende casos civiles de hasta $1.'],
    [/^Demand an appraisal, if fault isn’t in dispute and you’re more than \$2,000 apart \(or 25% of the car’s value, if that’s less\)\. N\.C\. Gen\. Stat\. § 20-279\.21\(d1\)\.$/, 'Exigir un avalúo, si la culpa no está en disputa y están a más de $2,000 de diferencia (o 25% del valor del auto, lo que sea menor). N.C. Gen. Stat. § 20-279.21(d1).'],
    [/^Send a written settlement demand by certified mail\. (.+)$/, 'Enviar una demanda de pago por escrito por correo certificado. Según O.C.G.A. § 33-4-7, si la aseguradora no paga en 60 días y luego usted recupera al menos ese monto, puede deber una penalidad y los honorarios de abogado.'],
    [/^Did you mean (.+)\?$/, '¿Quiso decir $1?'], [/^Use (.+@.+)$/, 'Usar $1'],
    [/North Carolina: if the other driver’s fault isn’t in dispute and their insurer’s number is more than \$2,000 from ours \(or 25% of the car’s value, if that’s less\), state law lets either side demand an appraisal\. Each side names a licensed appraiser; if they can’t agree, an umpire decides between the two numbers, and either side can reject that decision within 15 days\. We’ll show you this option if the offer comes in that far apart\./,
      'Carolina del Norte: si la culpa del otro conductor no está en disputa y la cifra de su aseguradora está a más de $2,000 de la nuestra (o 25% del valor del auto, lo que sea menor), la ley estatal permite que cualquiera de las partes exija un avalúo. Cada parte nombra un tasador con licencia; si no se ponen de acuerdo, un árbitro decide entre las dos cifras, y cualquiera de las partes puede rechazar esa decisión dentro de 15 días. Le mostraremos esta opción si la oferta llega así de lejos.'],
    [/Maryland: the state insurance department says uninsured and underinsured motorist coverage must pay diminished value, and insurers can’t exclude it \(Bulletin 24-8, April 2024\)\./,
      'Maryland: el departamento de seguros del estado dice que la cobertura de motorista sin seguro o con seguro insuficiente debe pagar el valor disminuido, y las aseguradoras no pueden excluirlo (Boletín 24-8, abril de 2024).'],
    [/^Add the offer letter or email above, under (.+), so we can check it\.$/, (m, s) => 'Agregue arriba la carta o el correo con la oferta, en ' + tr(s.replace(/[“”]/g, '')).replace(/^/, '“') + '”, para que podamos revisarla.'],
    [/^You don’t need the portal to work with us\. You can also call or text$/, 'No necesita el portal para trabajar con nosotros. También puede enviarnos un mensaje de texto al'],
    [/^, or email$/, ', o escribirnos a']
  ];
  function tr(s) {
    const key = s.trim(); if (!key) return s;
    const pre = s.slice(0, s.indexOf(key)), post = s.slice(s.indexOf(key) + key.length);
    if (X[key] != null) return pre + X[key] + post;
    let out = key;
    for (const [re, rep] of R) { if (re.test(out)) out = out.replace(re, rep); }
    return pre + st(out) + post;
  }
  const low1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  window.EC_T = tr;
  let busy = false;
  function walk(root) {
    if (busy || !root) return; busy = true;
    try {
      const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); const nodes = []; let n;
      while ((n = it.nextNode())) nodes.push(n);
      nodes.forEach((t) => { if (t.parentNode && /^(SCRIPT|STYLE)$/.test(t.parentNode.nodeName)) return; if (t.__es === t.nodeValue) return; const v = tr(t.nodeValue); if (v !== t.nodeValue) t.nodeValue = v; t.__es = t.nodeValue; });
      root.querySelectorAll && root.querySelectorAll('[placeholder],[aria-label]').forEach((el) => { ['placeholder', 'aria-label'].forEach((a) => { const v = el.getAttribute(a); if (v) { const w = tr(v); if (w !== v) el.setAttribute(a, w); } }); });
      root.querySelectorAll && root.querySelectorAll('a[href^="tel:"]').forEach((a) => { a.href = a.href.replace('tel:', 'sms:'); a.textContent = a.textContent.replace(/Call\s+(\d{3}-\d{3}-\d{4})/, 'Mensaje de texto al $1'); });
      root.querySelectorAll && root.querySelectorAll('select option').forEach((o) => { const v = st(o.textContent); if (v !== o.textContent) o.textContent = v; });
    } finally { busy = false; }
  }
  function watch(id) { const el = document.getElementById(id); if (!el) return; walk(el); new MutationObserver(() => walk(el)).observe(el, { childList: true, subtree: true, characterData: true }); }
  function boot() { watch('app'); watch('toast'); new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((x) => { if (x.nodeType === 1 && x.classList && x.classList.contains('sheet')) walk(x); }))).observe(document.body, { childList: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
