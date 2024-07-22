let connectedDevice = null;
let serviceUUID = null;
let characteristicUUID = null;

function startTest(testName, wavelength) {
    // Prompt for Bluetooth and location access
    requestBluetoothAccess()
        .then(() => {
            return navigator.bluetooth.requestDevice({ acceptAllDevices: true });
        })
        .then(device => {
            connectedDevice = device;
            document.getElementById('start-test').classList.add('hidden');
            document.getElementById('loading-screen').classList.remove('hidden');
            document.getElementById('device-name').textContent = `Connected to: ${device.name}`;
            document.getElementById('test-name').textContent = `Test: ${testName}`;
            document.getElementById('wavelength').textContent = `Wavelength: ${wavelength}`;

            // Show wavelength input form
            document.getElementById('wavelength-input').classList.remove('hidden');

            // Discover services and characteristics
            return discoverServicesAndCharacteristics();
        })
        .then(() => {
            // Start checking connection status every 10 seconds
            checkConnectionStatus();
        })
        .catch(error => {
            alert('Failed to connect to Bluetooth device: ' + error);
            document.getElementById('start-test').classList.remove('hidden');
            document.getElementById('loading-screen').classList.add('hidden');
        });
}

function discoverServicesAndCharacteristics() {
    if (connectedDevice) {
        return connectedDevice.gatt.connect()
            .then(server => server.getPrimaryServices())
            .then(services => {
                // For demonstration, assume the first service and its first characteristic
                if (services.length > 0) {
                    const firstService = services[0];
                    return firstService.getCharacteristics();
                } else {
                    throw new Error('No services found');
                }
            })
            .then(characteristics => {
                if (characteristics.length > 0) {
                    const firstCharacteristic = characteristics[0];
                    serviceUUID = firstCharacteristic.service.uuid;
                    characteristicUUID = firstCharacteristic.uuid;
                    console.log(`Discovered Service UUID: ${serviceUUID}`);
                    console.log(`Discovered Characteristic UUID: ${characteristicUUID}`);
                } else {
                    throw new Error('No characteristics found');
                }
            })
            .catch(error => {
                console.error('Error discovering services and characteristics:', error);
            });
    } else {
        return Promise.reject('No Bluetooth device connected.');
    }
}

function submitWavelength() {
    const wavelengthInput = document.getElementById('wavelength-value').value;
    const wavelength = parseFloat(wavelengthInput);
    
    if (isNaN(wavelength)) {
        alert('Please enter a valid wavelength.');
        return;
    }

    if (connectedDevice && serviceUUID && characteristicUUID) {
        connectedDevice.gatt.connect()
            .then(server => server.getPrimaryService(serviceUUID))
            .then(service => service.getCharacteristic(characteristicUUID))
            .then(characteristic => {
                const valueArray = new Uint8Array([wavelength]);
                return characteristic.writeValue(valueArray);
            })
            .then(() => {
                console.log(`Wavelength ${wavelength} sent successfully.`);
                document.getElementById('wavelength').textContent = `Wavelength: ${wavelength} nm`;
            })
            .catch(error => {
                alert('Failed to send wavelength: ' + error);
            });
    } else {
        alert('No Bluetooth device or UUID information available.');
    }
}

function testMockBluetooth() {
    startTest('Mock Bluetooth Test', 0); // Using 0 as a placeholder wavelength for mock
}

function requestBluetoothAccess() {
    return new Promise((resolve, reject) => {
        if (navigator.bluetooth) {
            navigator.bluetooth.requestDevice({ acceptAllDevices: true })
                .then(device => {
                    resolve(device);
                })
                .catch(error => {
                    reject('Bluetooth access is required: ' + error);
                });
        } else {
            reject('Bluetooth is not supported on your device.');
        }
    });
}

function checkConnectionStatus() {
    if (connectedDevice && connectedDevice.gatt.connected) {
        console.log('Bluetooth is connected.');
        setTimeout(checkConnectionStatus, 10000);
    } else {
        console.log('Bluetooth is disconnected.');
        alert('Bluetooth connection lost. Please reconnect.');
        document.getElementById('start-test').classList.remove('hidden');
        document.getElementById('loading-screen').classList.add('hidden');
        connectedDevice = null;
        serviceUUID = null;
        characteristicUUID = null;
    }
}

// Register Service Worker if supported
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
