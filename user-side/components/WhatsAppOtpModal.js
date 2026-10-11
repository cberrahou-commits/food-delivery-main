import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatAlgeriaPhoneForWhatsApp, openWhatsApp } from "../constants/wilayas";
import { XMarkIcon, CheckCircleIcon, ShieldCheckIcon } from "react-native-heroicons/solid";

const WhatsAppOtpModal = ({
  visible,
  phoneNumber,
  userId,
  onClose,
  onVerified,
}) => {
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [verifDocId, setVerifDocId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef(null);

  const cleanPhone = formatAlgeriaPhoneForWhatsApp(phoneNumber);

  // Démarrer l'envoi du code dès l'ouverture du modal
  useEffect(() => {
    if (visible && cleanPhone) {
      setCode("");
      setErrorMsg("");
      sendVerificationCode();
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [visible, cleanPhone]);

  const startCountdown = () => {
    setCountdown(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendVerificationCode = async () => {
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg("Numéro de téléphone invalide.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // Générer un code à 6 chiffres
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(newOtp);

      const verifRef = await addDoc(collection(db, "phoneVerifications"), {
        userId: userId || "anonymous",
        phone: phoneNumber,
        formattedPhone: cleanPhone,
        code: newOtp,
        status: "REQUESTED",
        verified: false,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      setVerifDocId(verifRef.id);
      startCountdown();
    } catch (err) {
      console.error("Erreur envoi OTP WhatsApp:", err);
      setErrorMsg("Impossible d'envoyer le code. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const inputClean = code.trim();
    if (inputClean.length !== 6) {
      setErrorMsg("Veuillez saisir les 6 chiffres du code reçu.");
      return;
    }

    setVerifying(true);
    setErrorMsg("");

    try {
      if (inputClean === generatedCode) {
        // Code valide !
        if (verifDocId) {
          await updateDoc(doc(db, "phoneVerifications", verifDocId), {
            verified: true,
            verifiedAt: serverTimestamp(),
            status: "VERIFIED",
          }).catch(console.warn);
        }

        if (userId) {
          await updateDoc(doc(db, "user", userId), {
            phoneNumber: cleanPhone,
            isPhoneVerified: true,
            phoneVerifiedAt: serverTimestamp(),
          }).catch(console.warn);
        }

        Alert.alert("Numéro vérifié ! 🎉", "Votre numéro WhatsApp a été validé avec succès.");
        if (onVerified) {
          onVerified(cleanPhone);
        }
        onClose();
      } else {
        setErrorMsg("Code incorrect. Veuillez vérifier le message reçu sur WhatsApp.");
      }
    } catch (err) {
      console.error("Erreur vérification code:", err);
      setErrorMsg("Erreur lors de la validation. Veuillez réessayer.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
            <View className="flex-row items-center space-x-2">
              <View className="p-2 bg-emerald-100 rounded-full">
                <ShieldCheckIcon size={22} color="#059669" />
              </View>
              <Text className="text-lg font-bold text-gray-900">
                Vérification WhatsApp 🔐
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-gray-100">
              <XMarkIcon size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View className="my-4">
            <Text className="text-sm text-gray-600 mb-1">
              Un code à 6 chiffres a été envoyé par WhatsApp au numéro :
            </Text>
            <View className="bg-emerald-50 border border-emerald-200 py-2.5 px-4 rounded-xl flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-emerald-800">
                🇩🇿 +{cleanPhone}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-xs text-emerald-700 font-semibold mr-1">En attente</Text>
                <ActivityIndicator size="small" color="#059669" />
              </View>
            </View>
          </View>

          {/* Saisie du code à 6 chiffres */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-700 mb-2">
              Entrez le code de sécurité (6 chiffres) :
            </Text>
            <TextInput
              value={code}
              onChangeText={(txt) => {
                setCode(txt.replace(/\D/g, "").slice(0, 6));
                setErrorMsg("");
              }}
              placeholder="Ex: 123456"
              keyboardType="number-pad"
              maxLength={6}
              className="bg-gray-50 border border-gray-300 h-14 rounded-2xl text-center text-2xl font-mono tracking-widest text-gray-900"
              autoFocus={true}
            />
            {errorMsg ? (
              <Text className="text-xs text-red-600 font-medium mt-1.5 text-center">
                ⚠️ {errorMsg}
              </Text>
            ) : null}
          </View>

          {/* Bouton de validation */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={verifying || loading || code.length !== 6}
            activeOpacity={0.8}
            className={`py-4 rounded-2xl items-center shadow-sm mb-3 ${
              code.length === 6 && !verifying
                ? "bg-emerald-600 active:bg-emerald-700"
                : "bg-gray-300"
            }`}
          >
            {verifying ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Valider mon numéro WhatsApp ✅
              </Text>
            )}
          </TouchableOpacity>

          {/* Renvoyer le code */}
          <View className="flex-row items-center justify-center space-x-1 py-2">
            <Text className="text-xs text-gray-500">Vous n'avez pas reçu le code ?</Text>
            {countdown > 0 ? (
              <Text className="text-xs font-bold text-emerald-700">
                Renvoyer dans {countdown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={sendVerificationCode} disabled={loading}>
                <Text className="text-xs font-bold text-emerald-700 underline">
                  Renvoyer un nouveau code
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default WhatsAppOtpModal;
