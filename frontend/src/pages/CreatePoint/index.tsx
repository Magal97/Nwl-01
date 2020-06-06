import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import {Link} from 'react-router-dom';
import {FiArrowLeft} from 'react-icons/fi';
import { Map, TileLayer, Marker, Popup} from 'react-leaflet';
import axios from 'axios';
import {LeafletMouseEvent} from 'leaflet';
import api from '../../services/api';
import Dropzone from '../../components/Dropzone';

import logo from '../../assets/logo.svg';
import './styles.css';

interface Item{
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUfResponse{
    sigla: string;
}

interface IBGECityResponse{
    nome: string;
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [cities, setCity] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedFile, setSelectedFile] = useState<File>();


    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const {latitude, longitude} = position.coords;
        
            setInitialPosition([latitude, longitude]);
        });
    }, []);


    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        });
    }, []);

    useEffect(() => {
        axios.get<IBGEUfResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);
            setStates(ufInitials);
        })
    },[]);

    useEffect(() => {
       if(selectedUf === '0'){
           return;
       }
       
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response =>{
            const cityNames = response.data.map(city => city.nome);
            setCity(cityNames);
        })
    }, [selectedUf])

    function handleSelectedUf(event: ChangeEvent<HTMLSelectElement>){
        const selected = event.target.value;
        setSelectedUf(selected);
    }

    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>){
        const selected = event.target.value;
        setSelectedCity(selected);
    }

    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const {name, value} = event.target;
        setFormData({...formData, [name]: value});
        console.log(value);

    }

    function handleSelectedItem(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected >= 0){
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        }else{
            setSelectedItems([...selectedItems, id]);
        }
        
        
    }

    async function handleSubmit(event: FormEvent){
        event.preventDefault();

        const {name, email, whatsapp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = new FormData();
            
        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(''));
        if(selectedFile){
            data.append('image', selectedFile)
        }

        await api.post('points', data);
        alert('criado');


    }

    
    return(
        <div id="page-create-point">
            <header> 
                <img src={logo} />

                <Link to="/" >
                   <FiArrowLeft />
                    Voltar
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1> Cadastro do <br/> ponto de coleta</h1>
               
                <Dropzone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field" >
                        <label htmlFor="name">Nome da entidade</label>
                        <input onChange={handleInputChange} type="text" 
                        name="name"
                        id="name"/>
                    </div>

                    <div className="field-group">
                        
                        <div className="field" >
                            <label htmlFor="email">E-mail</label>
                            <input onChange={handleInputChange} type="email" 
                            name="email"
                            id="email"/>
                        </div>
                        
                        <div className="field" >
                            <label htmlFor="whatsapp">WhatsApp</label>
                            <input onChange={handleInputChange} type="text" 
                            name="whatsapp"
                            id="whatsapp"/>
                        </div>
                    
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onclick={handleMapClick}>
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                        <Marker position={selectedPosition} />
                    </Map>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select value={selectedUf} onChange={handleSelectedUf} name="uf" id="uf">
                                <option value="0">Selecione uma UF</option>
                            {states.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                            </select>
                        </div>
                        
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select value={selectedCity} onChange={handleSelectedCity} name="city" id="city">
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item => (
                            <li key={item.id} 
                            onClick={() => handleSelectedItem(item.id)}
                            className={selectedItems.includes(item.id) ? 'selected' : '' }>
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))};
                    </ul>
                </fieldset>
                <button className="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>

        </div>    
    );

};

export default CreatePoint;