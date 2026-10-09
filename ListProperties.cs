using System;
using System.Reflection;
using OfficeOpenXml;
class Program {
    static void Main() {
        foreach (var p in typeof(ExcelPackage).GetProperties(BindingFlags.Public | BindingFlags.Static)) Console.WriteLine("Prop: " + p.Name);
        foreach (var m in typeof(ExcelPackage).GetMethods(BindingFlags.Public | BindingFlags.Static)) Console.WriteLine("Method: " + m.Name);
    }
}
